import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import env from '../../config/env.js';
import logger from '../../shared/logger.js';

const TARGET_DIMENSION = 1536;

/**
 * Normalizes any vector to unit length (L2 norm = 1.0)
 */
export const normalizeVector = (vec) => {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  return vec.map((val) => val / norm);
};

/**
 * Generate a deterministic normalized 1536-dim semantic vector for offline testing
 */
const generateDeterministicVector = (text) => {
  const vec = new Array(TARGET_DIMENSION).fill(0);
  const clean = text.toLowerCase().trim();

  // Character trigram hashing for semantic keyword similarity
  for (let i = 0; i < clean.length - 2; i++) {
    const code = clean.charCodeAt(i) * 31 + clean.charCodeAt(i + 1) * 17 + clean.charCodeAt(i + 2);
    const idx = Math.abs(code) % TARGET_DIMENSION;
    vec[idx] += 1.0;
  }

  // Add word level frequency
  const words = clean.split(/\s+/);
  for (let w = 0; w < words.length; w++) {
    let wordHash = 0;
    for (let c = 0; c < words[w].length; c++) {
      wordHash = (wordHash << 5) - wordHash + words[w].charCodeAt(c);
      wordHash |= 0;
    }
    const idx = Math.abs(wordHash) % TARGET_DIMENSION;
    vec[idx] += 2.0;
  }

  return normalizeVector(vec);
};

/**
 * Generate 1536-dimensional vector embedding for text
 */
export const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return new Array(TARGET_DIMENSION).fill(0);
  }

  const cleanText = text.slice(0, 8000); // Token safety limit
  const openaiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  // 1. Try OpenAI Embedding API (Primary for 1536d)
  if (openaiKey && openaiKey.trim() !== '') {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: cleanText,
        dimensions: TARGET_DIMENSION
      });
      if (response?.data?.[0]?.embedding) {
        return normalizeVector(response.data[0].embedding);
      }
    } catch (err) {
      logger.warn('Embeddings', 'OpenAI embedding call error:', { error: err.message });
    }
  }

  // 2. Try Gemini Embedding API
  if (geminiKey && geminiKey.trim() !== '') {
    const models = ['text-embedding-004', 'embedding-001'];
    for (const modelName of models) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent(cleanText);
        const values = result?.embedding?.values;

        if (values && values.length > 0) {
          // Project or extend to 1536 dimensions smoothly
          const vector1536 = new Array(TARGET_DIMENSION).fill(0);
          for (let i = 0; i < TARGET_DIMENSION; i++) {
            vector1536[i] = values[i % values.length] * (1.0 + (i >= values.length ? 0.05 : 0.0));
          }
          return normalizeVector(vector1536);
        }
      } catch (err) {
        logger.warn('Embeddings', `Gemini embedding model ${modelName} error:`, { error: err.message });
      }
    }
  }

  // 3. Fallback deterministic semantic vector
  return generateDeterministicVector(cleanText);
};

/**
 * Batch generate embeddings with concurrency control
 */
export const generateBatchEmbeddings = async (texts = [], batchSize = 10) => {
  const results = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(batch.map((t) => generateEmbedding(t)));
    results.push(...batchEmbeddings);
  }
  return results;
};

export default generateEmbedding;
