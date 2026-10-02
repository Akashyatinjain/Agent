import time
import json
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, update

from app.rag.extractors import extract_text_from_file
from app.rag.chunking import chunk_text
from app.rag.embeddings import generate_batch_embeddings
from app.rag.store import in_memory_store
from app.db.models import Document, File
from app.core.logging import logger

async def process_file_for_rag(
    file_id: str,
    user_id: str,
    buffer: bytes,
    mime_type: str = "",
    filename: str = "",
    db: Optional[AsyncSession] = None
) -> Dict[str, Any]:
    """Extract, chunk, embed, and store document vectors for RAG."""
    start_time = time.time()
    logger.info(f'Starting RAG processing for file "{filename}" ({file_id})')

    try:
        # 1. Extract text
        raw_text = await extract_text_from_file(buffer, mime_type, filename)
        if not raw_text or not raw_text.strip():
            raise ValueError("No readable text could be extracted from this document.")

        # 2. Chunk text
        chunks = chunk_text(raw_text, chunk_size=500, overlap=60)
        if not chunks:
            raise ValueError("Document content is too small to form semantic chunks.")

        logger.info(f'Extracted {len(chunks)} chunks from "{filename}". Generating embeddings...')

        # 3. Generate embeddings
        embeddings = await generate_batch_embeddings(chunks, batch_size=8)

        # 4. Store in in-memory store and database
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            metadata = {
                "filename": filename,
                "chunkIndex": i,
                "totalChunks": len(chunks),
                "sizeChars": len(chunk)
            }
            doc_id = f"doc-{file_id}-{i}"

            # In-memory store
            in_memory_store.save_document({
                "id": doc_id,
                "content": chunk,
                "metadata": metadata,
                "fileId": file_id,
                "userId": user_id,
                "embedding": emb
            })

            # DB persistence
            if db is not None:
                try:
                    vector_str = f"[{','.join(str(v) for v in emb)}]"
                    sql = text(
                        """INSERT INTO "Document" ("id", "content", "metadata", "embedding", "fileId", "userId", "createdAt", "updatedAt")
                           VALUES (:id, :content, :metadata::jsonb, :embedding::vector, :fileId, :userId, NOW(), NOW())
                           ON CONFLICT ("id") DO UPDATE
                           SET "content" = EXCLUDED."content",
                               "metadata" = EXCLUDED."metadata",
                               "embedding" = EXCLUDED."embedding",
                               "updatedAt" = NOW()"""
                    )
                    await db.execute(sql, {
                        "id": doc_id,
                        "content": chunk,
                        "metadata": json.dumps(metadata),
                        "embedding": vector_str,
                        "fileId": file_id,
                        "userId": user_id
                    })
                except Exception as insert_err:
                    logger.warning(f"Failed to persist pgvector document chunk {doc_id}: {insert_err}")

        if db is not None:
            await db.commit()

        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(f'Successfully indexed "{filename}" into {len(chunks)} RAG vectors in {duration_ms}ms')

        return {
            "success": True,
            "fileId": file_id,
            "chunkCount": len(chunks),
            "durationMs": duration_ms
        }
    except Exception as error:
        logger.error(f'Failed to process "{filename}" for RAG: {error}')
        return {
            "success": False,
            "fileId": file_id,
            "error": str(error)
        }
