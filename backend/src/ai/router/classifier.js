import ROUTER_CLASSIFIER_PROMPT from '../prompts/router.js';
import { generateLLMResponse } from '../llm/provider.js';
import { ROUTER_TYPES, MODEL_PROVIDERS } from '../../shared/constants.js';

export const classifyUserIntent = async (userMessage) => {
  const prompt = ROUTER_CLASSIFIER_PROMPT.replace('{{userMessage}}', userMessage);

  try {
    const rawResponse = await generateLLMResponse({
      provider: MODEL_PROVIDERS.GEMINI,
      prompt,
      systemPrompt: 'You are an explicit JSON classifier. Output JSON strictly without markdown formatting.',
    });

    // Clean JSON response string
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        pipeline: parsed.pipeline || ROUTER_TYPES.CHAT,
        reasoning: parsed.reasoning || 'Default classification',
        toolsNeeded: parsed.toolsNeeded || [],
        ragQuery: parsed.ragQuery || userMessage
      };
    }
  } catch (err) {
    console.warn('⚠️ Router Intent Classifier fallback triggered:', err.message);
  }

  // Smart heuristic fallback if LLM classification is unavailable
  const lower = userMessage.toLowerCase();
  
  if (lower.includes('weather') || lower.includes('temperature') || lower.includes('forecast')) {
    return {
      pipeline: ROUTER_TYPES.TOOL,
      reasoning: 'Heuristic keyword match: weather tool requested',
      toolsNeeded: ['weather'],
      ragQuery: ''
    };
  }

  if (lower.includes('search') || lower.includes('latest news') || lower.includes('who won') || lower.includes('today')) {
    return {
      pipeline: ROUTER_TYPES.TOOL,
      reasoning: 'Heuristic keyword match: real-time web search requested',
      toolsNeeded: ['web_search'],
      ragQuery: ''
    };
  }

  if (lower.includes('calculate') || /^[\d\s\+\-\*\/\(\)\.]+\s*$/.test(userMessage.trim())) {
    return {
      pipeline: ROUTER_TYPES.TOOL,
      reasoning: 'Heuristic keyword match: math calculation requested',
      toolsNeeded: ['calculator'],
      ragQuery: ''
    };
  }

  if (lower.includes('document') || lower.includes('file') || lower.includes('pdf') || lower.includes('resume') || lower.includes('my notes') || lower.includes('knowledge')) {
    return {
      pipeline: ROUTER_TYPES.RAG,
      reasoning: 'Heuristic keyword match: personal knowledge base/RAG search',
      toolsNeeded: [],
      ragQuery: userMessage
    };
  }

  return {
    pipeline: ROUTER_TYPES.CHAT,
    reasoning: 'Direct conversation intent',
    toolsNeeded: [],
    ragQuery: ''
  };
};

export default classifyUserIntent;
