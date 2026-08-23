import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../../config/env.js';
import { generateSmartFallbackResponse } from './smartFallback.js';
import logger from '../../shared/logger.js';

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

  // Live stable Google Gemini models in priority order
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro'
  ];

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
          if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'model') {
            formattedHistory.push({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content || '' }]
            });
          }
        }
      }

      // If we have history, use startChat for genuine multi-turn conversational context
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
          return completeText;
        } else {
          const result = await chat.sendMessage(prompt);
          return result.response.text();
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
          return completeText;
        } else {
          const result = await model.generateContent(prompt);
          return result.response.text();
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
