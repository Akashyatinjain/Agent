import env from '../../config/env.js';
import { generateSmartFallbackResponse } from './smartFallback.js';

export const generateMistralResponse = async ({ prompt, systemPrompt, history = [], onChunk = null }) => {
  const apiKey = env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.warn('⚠️ MISTRAL_API_KEY is missing. Using Smart Assistant mode.');
    return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'Mistral' });
  }

  const modelsToTry = [
    'mistral-small-latest',
    'mistral-medium-latest',
    'mistral-large-latest',
    'open-mistral-7b'
  ];

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  history.forEach((msg) => {
    messages.push({ role: msg.role, content: msg.content });
  });

  messages.push({ role: 'user', content: prompt });

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          stream: Boolean(onChunk)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ Mistral API call for model ${modelName} returned status ${response.status}: ${errorText.substring(0, 100)}`);
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
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }

        if (completeText && completeText.trim().length > 0) {
          return completeText;
        }
      } else {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (content && content.trim().length > 0) {
          if (onChunk) onChunk(content);
          return content;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Mistral model ${modelName} request failed: ${error.message}`);
    }
  }

  console.warn('⚠️ All Mistral models failed. Using Smart Assistant mode.');
  return generateSmartFallbackResponse({ prompt, systemPrompt, history, onChunk, provider: 'Mistral (Live API Fallback)' });
};

export default generateMistralResponse;
