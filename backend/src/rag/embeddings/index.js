import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import env from '../../config/env.js';

/**
 * Generate 1536-dimensional vector embedding for text
 */
export const generateEmbedding = async (text) => {
  const openaiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  // Try OpenAI embeddings first (most accurate)
  if (openaiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (err) {
      console.warn('OpenAI Embedding error:', err.message);
    }
  }

  // Try Gemini embeddings
  if (geminiKey && geminiKey.trim() !== '') {
    const embeddingModels = ['text-embedding-004', 'embedding-001'];
    for (const modelName of embeddingModels) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent(text);
        const vector = result.embedding.values;

        // Pad or trim vector array to 1536 length for standard schema compatibility
        if (vector.length < 1536) {
          const padded = new Array(1536).fill(0);
          for (let i = 0; i < vector.length; i++) padded[i] = vector[i];
          return padded;
        }
        return vector.slice(0, 1536);
      } catch (err) {
        console.warn(`Gemini Embedding model ${modelName} error:`, err.message);
      }
    }
  }

  // Fallback deterministic pseudo-embedding vector for offline / keyless testing
  console.warn('⚠️ Using fallback pseudo-embeddings (no valid API key for embeddings)');
  const vector = new Array(1536).fill(0);
  for (let i = 0; i < text.length && i < 1536; i++) {
    vector[i] = (text.charCodeAt(i) % 100) / 100;
  }
  return vector;
};

export default generateEmbedding;
