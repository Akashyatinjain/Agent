import { extractTextFromFile } from './extractors.js';
import { chunkText } from '../chunking/index.js';
import { generateEmbedding } from '../embeddings/index.js';
import prisma from '../../db/client.js';
import { saveInMemoryDocument, saveInMemoryFile } from '../store.js';

export const processFileForRAG = async ({ fileId, userId, buffer, mimeType, filename }) => {
  try {
    const rawText = await extractTextFromFile(buffer, mimeType, filename);
    const chunks = chunkText(rawText, 500, 50);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const metadata = { filename, chunkIndex: i, totalChunks: chunks.length };
      const embedding = await generateEmbedding(chunk);

      // Save to shared in-memory RAG store for immediate retrieval
      saveInMemoryDocument({
        id: `doc-${fileId}-${i}`,
        content: chunk,
        metadata,
        fileId,
        userId,
        embedding
      });

      try {
        const vectorString = `[${embedding.join(',')}]`;
        await prisma.$executeRawUnsafe(
          `INSERT INTO "Document" ("id", "content", "metadata", "embedding", "fileId", "userId", "createdAt")
           VALUES ($1, $2, $3, $4::vector, $5, $6, NOW())`,
          `doc-${fileId}-${i}`,
          chunk,
          JSON.stringify(metadata),
          vectorString,
          fileId,
          userId
        );
      } catch (dbErr) {
        try {
          await prisma.document.create({
            data: {
              id: `doc-${fileId}-${i}`,
              content: chunk,
              metadata,
              fileId,
              userId
            }
          });
        } catch (e) {}
      }
    }

    saveInMemoryFile({ id: fileId, userId, status: 'completed', chunkCount: chunks.length });

    try {
      await prisma.file.update({
        where: { id: fileId },
        data: { status: 'completed', chunkCount: chunks.length }
      });
    } catch (e) {}

    return { success: true, chunksCount: chunks.length };
  } catch (error) {
    console.error('RAG Ingestion Error:', error);
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
