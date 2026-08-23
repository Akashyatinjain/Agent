import env from '../../config/env.js';
import { generateSmartFallbackResponse } from './smartFallback.js';
import logger from '../../shared/logger.js';

export const generateMistralResponse = async ({
  prompt,
  systemPrompt,
  history = [],
  onChunk = null
}) => {
  const apiKey = env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    logger.warn('MistralLLM', 'MISTRAL_API_KEY missing. Using Smart Assistant fallback.');
    return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'Mistral' });
  }

  const modelsToTry = [
    'mistral-small-latest',
    'mistral-medium-latest',
    'open-mistral-7b'
  ];

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

  for (const modelName of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          stream: Boolean(onChunk)
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.warn('MistralLLM', `Mistral API returned status ${response.status} for model ${modelName}`);
        continue;
      }

      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let completeText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  completeText += content;
                  onChunk(content);
                }
              } catch (e) {}
            }
          }
        }

        if (completeText && completeText.trim().length > 0) {
          return completeText;
        }
      } else {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (content) {
          if (onChunk) onChunk(content);
          return content;
        }
      }
    } catch (error) {
      logger.warn('MistralLLM', `Mistral model ${modelName} error:`, { error: error.message });
    }
  }

  logger.warn('MistralLLM', 'All Mistral models failed. Using Smart Assistant fallback.');
  return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'Mistral (Fallback)' });
};

export default generateMistralResponse;
