import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../../config/env.js';
import { generateSmartFallbackResponse } from './smartFallback.js';
import logger from '../../shared/logger.js';

let cachedWorkingModel = null;

export const generateGeminiResponse = async ({
  prompt,
  systemPrompt,
  history = [],
  onChunk = null
}) => {
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    logger.warn('GeminiLLM', 'GEMINI_API_KEY missing. Using Smart Assistant fallback.');
    return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'Gemini' });
  }

  // Active Google Gemini models in priority order
  const modelsToTry = [
    ...(cachedWorkingModel ? [cachedWorkingModel] : []),
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash'
  ].filter((v, i, a) => a.indexOf(v) === i);

  for (const modelName of modelsToTry) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const modelOptions = { model: modelName };
      if (systemPrompt && systemPrompt.trim().length > 0) {
        modelOptions.systemInstruction = systemPrompt;
      }

      const model = genAI.getGenerativeModel(modelOptions);

      // Convert conversation history to Gemini SDK format
      const formattedHistory = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const msg of history) {
          const rawRole = (msg.role || '').toLowerCase();
          if (rawRole === 'user' || rawRole === 'assistant' || rawRole === 'model') {
            formattedHistory.push({
              role: rawRole === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content || '' }]
            });
          }
        }
      }

      // Gemini startChat requires the first turn in history to have role 'user'
      while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
        formattedHistory.shift();
      }

      // If we have history, use startChat for multi-turn conversational context
      if (formattedHistory.length > 0) {
        const chat = model.startChat({
          history: formattedHistory
        });

        if (onChunk) {
          const result = await chat.sendMessageStream(prompt);
          let completeText = '';
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              completeText += chunkText;
              onChunk(chunkText);
            }
          }
          cachedWorkingModel = modelName;
          return completeText;
        } else {
          const result = await chat.sendMessage(prompt);
          const text = result.response.text();
          cachedWorkingModel = modelName;
          return text;
        }
      } else {
        // Direct single-turn prompt
        if (onChunk) {
          const result = await model.generateContentStream(prompt);
          let completeText = '';
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              completeText += chunkText;
              onChunk(chunkText);
            }
          }
          cachedWorkingModel = modelName;
          return completeText;
        } else {
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          cachedWorkingModel = modelName;
          return text;
        }
      }
    } catch (error) {
      logger.warn('GeminiLLM', `Gemini model ${modelName} call failed:`, { error: error.message });
    }
  }

  logger.warn('GeminiLLM', 'All Gemini models failed. Using Smart Assistant fallback.');
  return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'Gemini (Live API Fallback)' });
};

export default generateGeminiResponse;
