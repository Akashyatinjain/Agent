import OpenAI from 'openai';
import env from '../../config/env.js';
import { generateSmartFallbackResponse } from './smartFallback.js';
import logger from '../../shared/logger.js';

export const generateOpenAIResponse = async ({
  prompt,
  systemPrompt,
  history = [],
  onChunk = null
}) => {
  const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    logger.warn('OpenAILLM', 'OPENAI_API_KEY missing. Using Smart Assistant fallback.');
    return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'OpenAI' });
  }

  const modelsToTry = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

  for (const modelName of modelsToTry) {
    try {
      const openai = new OpenAI({ apiKey });
      const messages = [];

      if (systemPrompt && systemPrompt.trim().length > 0) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      if (Array.isArray(history)) {
        for (const msg of history) {
          if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
            messages.push({ role: msg.role, content: msg.content || '' });
          }
        }
      }

      messages.push({ role: 'user', content: prompt });

      if (onChunk) {
        const stream = await openai.chat.completions.create({
          model: modelName,
          messages,
          stream: true,
          temperature: 0.7
        });

        let completeText = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            completeText += content;
            onChunk(content);
          }
        }
        return completeText;
      } else {
        const completion = await openai.chat.completions.create({
          model: modelName,
          messages,
          temperature: 0.7
        });
        return completion.choices[0]?.message?.content || '';
      }
    } catch (error) {
      logger.warn('OpenAILLM', `OpenAI model ${modelName} request failed:`, { error: error.message });
      if (error.status === 429 || error.code === 'insufficient_quota') {
        const msg = `⚠️ **OpenAI Quota Limit**: Your OpenAI API account has reached its billing credit limit. Switch to Gemini or Mistral in the top-right model selector for uninterrupted responses.`;
        if (onChunk) onChunk(msg);
        return msg;
      }
    }
  }

  logger.warn('OpenAILLM', 'OpenAI models failed. Using Smart Assistant fallback.');
  return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'OpenAI (Fallback)' });
};

export default generateOpenAIResponse;
