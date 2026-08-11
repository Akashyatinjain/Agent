import OpenAI from 'openai';
import env from '../../config/env.js';
import { generateSmartFallbackResponse } from './smartFallback.js';

export const generateOpenAIResponse = async ({ prompt, systemPrompt, history = [], onChunk = null }) => {
  const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey || !apiKey.startsWith('sk-')) {
    console.warn('⚠️ OPENAI_API_KEY is missing or invalid format. Using Smart Assistant mode.');
    return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'OpenAI' });
  }

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
        model: 'gpt-4o-mini',
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
        model: 'gpt-4o-mini',
        messages,
      });
      return completion.choices[0]?.message?.content || '';
    }
  } catch (error) {
    console.warn('⚠️ OpenAI API call failed:', error.message.substring(0, 80));
    return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'OpenAI (Live API Fallback)' });
  }
};

export default generateOpenAIResponse;
