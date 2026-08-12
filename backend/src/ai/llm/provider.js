import { generateGeminiResponse } from './gemini.js';
import { generateOpenAIResponse } from './openai.js';
import { generateMistralResponse } from './mistral.js';
import { MODEL_PROVIDERS } from '../../shared/constants.js';

export const generateLLMResponse = async ({
  provider = MODEL_PROVIDERS.GEMINI,
  prompt,
  systemPrompt,
  history = [],
  onChunk = null
}) => {
  if (provider === MODEL_PROVIDERS.OPENAI) {
    return await generateOpenAIResponse({ prompt, systemPrompt, history, onChunk });
  } else if (provider === MODEL_PROVIDERS.MISTRAL) {
    return await generateMistralResponse({ prompt, systemPrompt, history, onChunk });
  } else {
    return await generateGeminiResponse({ prompt, systemPrompt, history, onChunk });
  }
};

export default generateLLMResponse;
