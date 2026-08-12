import OpenAI from 'openai';
import env from '../../config/env.js';
import { generateSmartFallbackResponse } from './smartFallback.js';

export const generateOpenAIResponse = async ({ prompt, systemPrompt, history = [], onChunk = null }) => {
  const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.warn('⚠️ OPENAI_API_KEY is missing. Using Smart Assistant mode.');
    return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'OpenAI' });
  }

  const modelsToTry = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

  for (const modelName of modelsToTry) {
    try {
      const openai = new OpenAI({ apiKey });
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      history.forEach((msg) => {
        messages.push({ role: msg.role, content: msg.content });
      });

      messages.push({ role: 'user', content: prompt });

      if (onChunk) {
        const stream = await openai.chat.completions.create({
          model: modelName,
          messages,
          stream: true,
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
        });
        return completion.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.warn(`⚠️ OpenAI model ${modelName} call failed:`, error.message.substring(0, 100));
      if (error.status === 429 || error.code === 'insufficient_quota' || error.code === 'credit_balance_exhausted') {
        const msg = `⚠️ **OpenAI Quota Exceeded**: The OpenAI API key has no remaining billing credits. Please top up credits at platform.openai.com or switch to the Gemini or Mistral model.`;
        if (onChunk) onChunk(msg);
        return msg;
      }
    }
  }

  console.warn('⚠️ OpenAI models failed. Falling back to Smart Assistant mode.');
  return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'OpenAI (Fallback)' });
};

export default generateOpenAIResponse;
