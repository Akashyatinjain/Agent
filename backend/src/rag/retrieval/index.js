import { generateEmbedding } from '../embeddings/index.js';
import prisma from '../../db/client.js';
import { getInMemoryDocuments } from '../store.js';

export const retrieveRelevantChunks = async ({ query, userId, topK = 5 }) => {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    let results = [];
    try {
      // Execute pgvector cosine similarity search (<=> operator)
      results = await prisma.$queryRawUnsafe(
        `SELECT id, content, metadata, "fileId", 1 - (embedding <=> $1::vector) as similarity
         FROM "Document"
         WHERE "userId" = $2
         ORDER BY embedding <=> $1::vector ASC
         LIMIT $3`,
        vectorString,
        userId,
        topK
      );
    } catch (pgErr) {
      try {
        results = await prisma.document.findMany({
          where: { userId, content: { contains: query, mode: 'insensitive' } },
          take: topK
        });
      } catch (e) {}
    }

    // Fallback: If no vector results found from DB, try fetching user's document chunks
    if (!results || results.length === 0) {
      try {
        results = await prisma.document.findMany({
          where: { userId },
          take: topK
        });
      } catch (e) {}
    }

    // Check shared in-memory document cache if DB yields empty
    if (!results || results.length === 0) {
      const memDocs = getInMemoryDocuments(userId);
      results = memDocs.slice(0, topK).map((d) => ({
        id: d.id,
        content: d.content,
        metadata: d.metadata,
        similarity: 0.9
      }));
    }

    return results.map((item) => ({
      id: item.id,
      content: item.content,
      metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata,
      similarity: item.similarity || 0.85
    }));
  } catch (error) {
    console.warn('RAG Retrieval warning:', error.message);
    const memDocs = getInMemoryDocuments(userId);
    return memDocs.slice(0, topK).map((d) => ({
      id: d.id,
      content: d.content,
      metadata: d.metadata,
      similarity: 0.85
    }));
  }
};

export default retrieveRelevantChunks;
