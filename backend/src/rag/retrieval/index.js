import { generateEmbedding } from '../embeddings/index.js';
import prisma from '../../db/client.js';
import { searchInMemoryDocuments, getInMemoryDocuments } from '../store.js';
import logger from '../../shared/logger.js';

export const retrieveRelevantChunks = async ({
  query,
  userId,
  fileId = null,
  topK = 5,
  minSimilarity = 0.15
}) => {
  if (!query || typeof query !== 'string') {
    query = '';
  }

  const cleanQuery = query.trim();
  let results = [];

  try {
    const queryEmbedding = await generateEmbedding(cleanQuery || 'document overview resume summary');
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // 1. Try pgvector Cosine Distance (<=> operator) in Neon PostgreSQL
    try {
      let rawDbResults = [];
      if (fileId) {
        rawDbResults = await prisma.$queryRawUnsafe(
          `SELECT id, content, metadata, "fileId", 1 - (embedding <=> $1::vector) as similarity
           FROM "Document"
           WHERE "userId" = $2
             AND "fileId" = $3
             AND embedding IS NOT NULL
             AND 1 - (embedding <=> $1::vector) >= $4
           ORDER BY embedding <=> $1::vector ASC
           LIMIT $5`,
          vectorString,
          userId,
          fileId,
          minSimilarity,
          topK
        );
      } else {
        rawDbResults = await prisma.$queryRawUnsafe(
          `SELECT id, content, metadata, "fileId", 1 - (embedding <=> $1::vector) as similarity
           FROM "Document"
           WHERE "userId" = $2
             AND embedding IS NOT NULL
             AND 1 - (embedding <=> $1::vector) >= $3
           ORDER BY embedding <=> $1::vector ASC
           LIMIT $4`,
          vectorString,
          userId,
          minSimilarity,
          topK
        );
      }

      if (Array.isArray(rawDbResults) && rawDbResults.length > 0) {
        results = rawDbResults.map((item) => ({
          id: item.id,
          content: item.content,
          metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {}),
          fileId: item.fileId,
          similarity: parseFloat((Number(item.similarity) || 0).toFixed(4))
        }));
      }
    } catch (dbVectorErr) {
      logger.warn('Retrieval', 'pgvector SQL query failed, trying fallback:', { error: dbVectorErr.message });
      
      // Secondary fallback: full-text search in PostgreSQL
      try {
        const textDbResults = await prisma.document.findMany({
          where: {
            userId,
            ...(fileId ? { fileId } : {}),
            content: { contains: cleanQuery, mode: 'insensitive' }
          },
          take: topK
        });

        if (textDbResults.length > 0) {
          results = textDbResults.map((item) => ({
            id: item.id,
            content: item.content,
            metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {}),
            fileId: item.fileId,
            similarity: 0.65
          }));
        }
      } catch (e) {}
    }

    // 2. Check in-memory vector cache if DB returned no results
    if (results.length === 0) {
      const memResults = searchInMemoryDocuments(queryEmbedding, userId, topK, minSimilarity, fileId);
      if (memResults.length > 0) {
        results = memResults;
      }
    }

    // 3. Document fallback: If user asked a generic inquiry ("i have uploaded", "how is my resume", "summarize")
    // and vector search matched 0 chunks, fetch the latest uploaded document chunks so LLM has the actual text!
    if (results.length === 0) {
      // In-memory latest chunks
      const allMemDocs = getInMemoryDocuments(userId, fileId);
      if (allMemDocs.length > 0) {
        results = allMemDocs.slice(0, topK).map((d) => ({
          id: d.id,
          content: d.content,
          metadata: d.metadata || {},
          fileId: d.fileId,
          similarity: 0.7
        }));
      } else {
        // DB latest chunks
        try {
          const latestDbDocs = await prisma.document.findMany({
            where: { userId, ...(fileId ? { fileId } : {}) },
            orderBy: { createdAt: 'desc' },
            take: topK
          });
          if (latestDbDocs.length > 0) {
            results = latestDbDocs.map((item) => ({
              id: item.id,
              content: item.content,
              metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {}),
              fileId: item.fileId,
              similarity: 0.7
            }));
          }
        } catch (e) {}
      }
    }

    return results;
  } catch (error) {
    logger.error('Retrieval', 'Failed to retrieve relevant chunks:', { error: error.message, query: cleanQuery });
    return [];
  }
};

export default retrieveRelevantChunks;
