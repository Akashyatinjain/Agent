import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../../config/env.js';
import { generateSmartFallbackResponse } from './smartFallback.js';

export const generateGeminiResponse = async ({ prompt, systemPrompt, history = [], onChunk = null }) => {
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  // If no key or invalid key format, use smart fallback assistant
  if (!apiKey || !apiKey.startsWith('AIzaSy')) {
    console.warn('⚠️ GEMINI_API_KEY is missing or invalid format (should start with AIzaSy). Using Smart Assistant mode.');
    return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'Gemini' });
  }

  // Live model candidates
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash',
    'gemini-pro'
  ];

  for (const modelName of modelsToTry) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      let fullPrompt = prompt;
      if (systemPrompt) {
        fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
      }

      if (onChunk) {
        const result = await model.generateContentStream(fullPrompt);
        let completeText = '';
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          completeText += chunkText;
          onChunk(chunkText);
        }
        return completeText;
      } else {
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
      }
    } catch (error) {
      console.warn(`⚠️ Gemini model ${modelName} call failed: ${error.message.substring(0, 80)}`);
    }
  }

  console.warn('⚠️ All live Gemini models failed. Using Smart Assistant mode.');
  return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'Gemini (Live API Fallback)' });
};

export default generateGeminiResponse;
