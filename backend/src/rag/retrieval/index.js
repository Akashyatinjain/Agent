import { generateEmbedding } from '../embeddings/index.js';
import prisma from '../../db/client.js';

export const retrieveRelevantChunks = async ({ query, userId, topK = 4 }) => {
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
      // Fallback search by content matching if pgvector extension is disabled
      results = await prisma.document.findMany({
        where: { userId, content: { contains: query, mode: 'insensitive' } },
        take: topK
      });
    }

    return results.map((item) => ({
      id: item.id,
      content: item.content,
      metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata,
      similarity: item.similarity || 0.85
    }));
  } catch (error) {
    console.warn('RAG Retrieval warning:', error.message);
    return [];
  }
};

export default retrieveRelevantChunks;
