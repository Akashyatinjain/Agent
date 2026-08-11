import { extractTextFromFile } from './extractors.js';
import { chunkText } from '../chunking/index.js';
import { generateEmbedding } from '../embeddings/index.js';
import prisma from '../../db/client.js';

export const processFileForRAG = async ({ fileId, userId, buffer, mimeType, filename }) => {
  try {
    const rawText = await extractTextFromFile(buffer, mimeType, filename);
    const chunks = chunkText(rawText, 500, 50);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);

      try {
        // Formatted pgvector array string representation: '[0.1, 0.2, ...]'
        const vectorString = `[${embedding.join(',')}]`;
        
        await prisma.$executeRawUnsafe(
          `INSERT INTO "Document" ("id", "content", "metadata", "embedding", "fileId", "userId", "createdAt")
           VALUES ($1, $2, $3, $4::vector, $5, $6, NOW())`,
          `doc-${fileId}-${i}`,
          chunk,
          JSON.stringify({ filename, chunkIndex: i, totalChunks: chunks.length }),
          vectorString,
          fileId,
          userId
        );
      } catch (dbErr) {
        // Fallback store without vector column if pgvector extension isn't initialized on DB instance yet
        await prisma.document.create({
          data: {
            id: `doc-${fileId}-${i}`,
            content: chunk,
            metadata: { filename, chunkIndex: i, totalChunks: chunks.length },
            fileId,
            userId
          }
        });
      }
    }

    // Mark file as completed
    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'completed', chunkCount: chunks.length }
    });

    return { success: true, chunksCount: chunks.length };
  } catch (error) {
    console.error('RAG Ingestion Error:', error);
    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'failed' }
    });
    throw error;
  }
};

export default processFileForRAG;
