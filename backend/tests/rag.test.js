import { test, describe } from 'node:test';
import assert from 'node:assert';
import { extractTextFromFile } from '../src/rag/ingestion/extractors.js';
import { chunkText } from '../src/rag/chunking/index.js';
import { generateEmbedding, normalizeVector } from '../src/rag/embeddings/index.js';
import {
  saveInMemoryDocument,
  searchInMemoryDocuments,
  deleteInMemoryFile
} from '../src/rag/store.js';
import { rerankChunks } from '../src/rag/reranking/index.js';

describe('RAG Pipeline Unit & Integration Tests', () => {
  describe('Text Extraction', () => {
    test('Extracts plain text and markdown buffers correctly', async () => {
      const buffer = Buffer.from('# Project Overview\nThis is a test document with markdown.');
      const text = await extractTextFromFile(buffer, 'text/markdown', 'readme.md');
      assert.match(text, /Project Overview/);
      assert.match(text, /test document/);
    });

    test('Extracts structured JSON buffers correctly', async () => {
      const jsonBuffer = Buffer.from(JSON.stringify({ name: 'MiniGPT', version: '1.0.0' }));
      const text = await extractTextFromFile(jsonBuffer, 'application/json', 'config.json');
      assert.match(text, /MiniGPT/);
      assert.match(text, /1.0.0/);
    });
  });

  describe('Semantic Chunking', () => {
    test('Splits long text into bounded chunks with overlap', () => {
      const longText = 'Paragraph one with details. '.repeat(40) + '\n\n' + 'Paragraph two with more details. '.repeat(40);
      const chunks = chunkText(longText, 300, 40, 30);
      assert.ok(chunks.length > 1);
      assert.ok(chunks.every((c) => c.length >= 30 && c.length <= 400));
    });

    test('Returns single chunk for short text', () => {
      const shortText = 'Short document content.';
      const chunks = chunkText(shortText, 500, 50);
      assert.strictEqual(chunks.length, 1);
      assert.strictEqual(chunks[0], shortText);
    });
  });

  describe('Vector Embeddings & Normalization', () => {
    test('Generates 1536-dimensional L2-normalized vector', async () => {
      const vector = await generateEmbedding('Machine learning and vector embeddings');
      assert.strictEqual(vector.length, 1536);

      // Verify unit vector norm (||v|| ≈ 1.0)
      let norm = 0;
      for (const val of vector) norm += val * val;
      norm = Math.sqrt(norm);
      assert.ok(Math.abs(norm - 1.0) < 0.01, `Expected norm to be ~1.0, got ${norm}`);
    });
  });

  describe('In-Memory RAG Vector Store & Cosine Similarity', () => {
    const testUserId = 'test-user-999';
    const testFileId = 'file-test-123';

    test('Saves document and performs exact cosine similarity search', async () => {
      const doc1Vector = await generateEmbedding('Python web development with FastAPI and Django');
      const doc2Vector = await generateEmbedding('Baking chocolate chip cookies and desserts');

      saveInMemoryDocument({
        id: 'doc-1',
        content: 'Python web development framework guide',
        metadata: { filename: 'python_guide.md' },
        fileId: testFileId,
        userId: testUserId,
        embedding: doc1Vector
      });

      saveInMemoryDocument({
        id: 'doc-2',
        content: 'Delicious chocolate cookie recipes',
        metadata: { filename: 'cookies.txt' },
        fileId: testFileId,
        userId: testUserId,
        embedding: doc2Vector
      });

      const queryVector = await generateEmbedding('Python programming and frameworks');
      const results = searchInMemoryDocuments(queryVector, testUserId, 2, 0.1);

      assert.ok(results.length > 0);
      assert.strictEqual(results[0].id, 'doc-1');
      assert.ok(results[0].similarity > 0.2);

      // Cleanup
      deleteInMemoryFile(testFileId, testUserId);
    });
  });

  describe('Hybrid Reranking', () => {
    test('Reranks chunks by boosting exact query keyword matches', () => {
      const chunks = [
        { id: '1', content: 'General information about databases and cloud storage.', similarity: 0.7 },
        { id: '2', content: 'PostgreSQL pgvector allows 1536-dimensional cosine distance similarity indexing.', similarity: 0.65 }
      ];

      const reranked = rerankChunks(chunks, 'PostgreSQL pgvector 1536');
      assert.strictEqual(reranked[0].id, '2'); // Chunk 2 boosted due to keyword relevance
      assert.ok(reranked[0].rerankScore >= reranked[1].rerankScore);
    });
  });
});
