import { extractTextFromFile } from './extractors.js';
import { chunkText } from '../chunking/index.js';
import { generateBatchEmbeddings } from '../embeddings/index.js';
import prisma from '../../db/client.js';
import { saveInMemoryDocument, saveInMemoryFile } from '../store.js';
import logger from '../../shared/logger.js';

export const processFileForRAG = async ({ fileId, userId, buffer, mimeType, filename }) => {
  const startTime = Date.now();
  logger.info('RAGIngestion', `Starting RAG processing for file "${filename}" (${fileId})`);

  try {
    // 1. Extract plain text from file buffer
    const rawText = await extractTextFromFile(buffer, mimeType, filename);
    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No readable text could be extracted from this document.');
    }

    // 2. Chunk text semantically
    const chunks = chunkText(rawText, 500, 60);
    if (chunks.length === 0) {
      throw new Error('Document content is too small to form semantic chunks.');
    }

    logger.info('RAGIngestion', `Extracted ${chunks.length} chunks from "${filename}". Generating embeddings...`);

    // 3. Batch generate 1536-dimensional embeddings
    const embeddings = await generateBatchEmbeddings(chunks, 8);

    // 4. Store each chunk in shared memory cache and database
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      const metadata = {
        filename,
        chunkIndex: i,
        totalChunks: chunks.length,
        sizeChars: chunk.length
      };

      const docId = `doc-${fileId}-${i}`;

      // Immediate in-memory sync for zero-latency retrieval
      saveInMemoryDocument({
        id: docId,
        content: chunk,
        metadata,
        fileId,
        userId,
        embedding
      });

      // Write to pgvector table in Neon PostgreSQL
      try {
        const vectorString = `[${embedding.join(',')}]`;
        await prisma.$executeRawUnsafe(
          `INSERT INTO "Document" ("id", "content", "metadata", "embedding", "fileId", "userId", "createdAt")
           VALUES ($1, $2, $3, $4::vector, $5, $6, NOW())
           ON CONFLICT ("id") DO UPDATE SET "content" = $2, "metadata" = $3, "embedding" = $4::vector`,
          docId,
          chunk,
          JSON.stringify(metadata),
          vectorString,
          fileId,
          userId
        );
      } catch (dbVectorErr) {
        // Fallback standard create if pgvector extension is not enabled in database
        try {
          await prisma.document.upsert({
            where: { id: docId },
            update: { content: chunk, metadata, fileId, userId },
            create: { id: docId, content: chunk, metadata, fileId, userId }
          });
        } catch (e) {}
      }
    }

    // 5. Update File record status
    saveInMemoryFile({ id: fileId, userId, status: 'completed', chunkCount: chunks.length });

    try {
      await prisma.file.update({
        where: { id: fileId },
        data: { status: 'completed', chunkCount: chunks.length }
      });
    } catch (e) {}

    const durationMs = Date.now() - startTime;
    logger.info('RAGIngestion', `✅ Successfully indexed "${filename}" into ${chunks.length} RAG vectors in ${durationMs}ms`);

    return {
      success: true,
      fileId,
      chunkCount: chunks.length,
      durationMs
    };
  } catch (error) {
    logger.error('RAGIngestion', `Failed to process "${filename}" for RAG:`, { error: error.message, fileId });
    
    saveInMemoryFile({ id: fileId, userId, status: 'failed' });
    try {
      await prisma.file.update({
        where: { id: fileId },
        data: { status: 'failed' }
      });
    } catch (e) {}

    throw error;
  }
};

export default processFileForRAG;
