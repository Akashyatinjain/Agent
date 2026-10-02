import json
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select

from app.rag.embeddings import generate_embedding
from app.rag.reranking import rerank_chunks
from app.rag.store import in_memory_store
from app.db.models import Document
from app.core.logging import logger

async def retrieve_relevant_chunks(
    query: str,
    user_id: str,
    db: Optional[AsyncSession] = None,
    file_id: Optional[str] = None,
    top_k: int = 5,
    min_similarity: float = 0.15
) -> List[Dict[str, Any]]:
    """Retrieve top relevant document chunks using pgvector, text search, and in-memory fallback."""
    clean_query = (query or "").strip()
    results: List[Dict[str, Any]] = []

    try:
        query_embedding = await generate_embedding(clean_query or "document overview resume summary")
        vector_str = f"[{','.join(str(v) for v in query_embedding)}]"

        # 1. Try pgvector SQL in database
        if db is not None:
            try:
                if file_id:
                    sql = text(
                        """SELECT id, content, metadata, "fileId", 1 - (embedding <=> :vec::vector) as similarity
                           FROM "Document"
                           WHERE "userId" = :user_id
                             AND "fileId" = :file_id
                             AND embedding IS NOT NULL
                             AND 1 - (embedding <=> :vec::vector) >= :min_sim
                           ORDER BY embedding <=> :vec::vector ASC
                           LIMIT :limit"""
                    )
                    db_res = await db.execute(sql, {
                        "vec": vector_str,
                        "user_id": user_id,
                        "file_id": file_id,
                        "min_sim": min_similarity,
                        "limit": top_k
                    })
                else:
                    sql = text(
                        """SELECT id, content, metadata, "fileId", 1 - (embedding <=> :vec::vector) as similarity
                           FROM "Document"
                           WHERE "userId" = :user_id
                             AND embedding IS NOT NULL
                             AND 1 - (embedding <=> :vec::vector) >= :min_sim
                           ORDER BY embedding <=> :vec::vector ASC
                           LIMIT :limit"""
                    )
                    db_res = await db.execute(sql, {
                        "vec": vector_str,
                        "user_id": user_id,
                        "min_sim": min_similarity,
                        "limit": top_k
                    })

                rows = db_res.fetchall()
                if rows:
                    for row in rows:
                        meta = row.metadata if isinstance(row.metadata, dict) else json.loads(row.metadata or "{}")
                        results.append({
                            "id": row.id,
                            "content": row.content,
                            "metadata": meta,
                            "fileId": row.fileId,
                            "similarity": round(float(row.similarity or 0), 4)
                        })
            except Exception as vector_err:
                logger.warning(f"pgvector query error, trying text search fallback: {vector_err}")
                # Text search fallback
                try:
                    stmt = select(Document).where(Document.userId == user_id)
                    if file_id:
                        stmt = stmt.where(Document.fileId == file_id)
                    if clean_query:
                        stmt = stmt.where(Document.content.ilike(f"%{clean_query}%"))
                    stmt = stmt.limit(top_k)
                    txt_res = await db.execute(stmt)
                    docs = txt_res.scalars().all()
                    for d in docs:
                        results.append({
                            "id": d.id,
                            "content": d.content,
                            "metadata": d.metadata_ or {},
                            "fileId": d.fileId,
                            "similarity": 0.65
                        })
                except Exception as txt_err:
                    logger.warning(f"Text search fallback error: {txt_err}")

        # 2. Check in-memory store if DB returned no results
        if not results:
            mem_results = in_memory_store.search_documents(
                query_vector=query_embedding,
                user_id=user_id,
                top_k=top_k,
                min_similarity=min_similarity,
                file_id=file_id
            )
            if mem_results:
                results = mem_results

        # 3. Fallback: return latest uploaded documents for this user
        if not results and db is not None:
            try:
                stmt = select(Document).where(Document.userId == user_id)
                if file_id:
                    stmt = stmt.where(Document.fileId == file_id)
                stmt = stmt.order_by(Document.createdAt.desc()).limit(top_k)
                latest_res = await db.execute(stmt)
                for d in latest_res.scalars().all():
                    results.append({
                        "id": d.id,
                        "content": d.content,
                        "metadata": d.metadata_ or {},
                        "fileId": d.fileId,
                        "similarity": 0.40
                    })
            except Exception:
                pass

        # Apply hybrid reranking
        if results:
            return rerank_chunks(results, clean_query)
        return []
    except Exception as e:
        logger.error(f"RAG retrieval failed: {e}")
        return []
