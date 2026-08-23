import ROUTER_CLASSIFIER_PROMPT from '../prompts/router.js';
import { generateLLMResponse } from '../llm/provider.js';
import { ROUTER_TYPES, MODEL_PROVIDERS, TOOL_NAMES } from '../../shared/constants.js';
import logger from '../../shared/logger.js';

export const classifyUserIntent = async (userMessage) => {
  if (!userMessage || typeof userMessage !== 'string') {
    return {
      pipeline: ROUTER_TYPES.CHAT,
      reasoning: 'Empty message defaulted to chat',
      toolsNeeded: [],
      ragQuery: ''
    };
  }

  const clean = userMessage.trim();
  const lower = clean.toLowerCase();

  // Fast-path Heuristics for immediate routing without latency
  // 1. Math / Calculation
  if (
    /^(?:calculate|compute|what is|evaluate|solve)\s+[\d\s+\-*/().,%eE]+$/i.test(lower) ||
    /^[\d\s+\-*/().,%eE]{3,}$/.test(lower) ||
    lower.includes('calculate ') ||
    lower.includes('solve ')
  ) {
    return {
      pipeline: ROUTER_TYPES.TOOL,
      reasoning: 'Mathematical calculation intent detected',
      toolsNeeded: [TOOL_NAMES.CALCULATOR],
      ragQuery: ''
    };
  }

  // 2. Weather
  if (
    lower.includes('weather') ||
    lower.includes('temperature') ||
    lower.includes('forecast') ||
    lower.includes('climate in')
  ) {
    return {
      pipeline: ROUTER_TYPES.TOOL,
      reasoning: 'Weather inquiry intent detected',
      toolsNeeded: [TOOL_NAMES.WEATHER],
      ragQuery: ''
    };
  }

  // 3. Web Search / Real-time events
  if (
    lower.startsWith('search ') ||
    lower.startsWith('google ') ||
    lower.includes('latest news') ||
    lower.includes('who won ') ||
    lower.includes('current stock price') ||
    lower.includes('search the web for')
  ) {
    return {
      pipeline: ROUTER_TYPES.TOOL,
      reasoning: 'Live web search intent detected',
      toolsNeeded: [TOOL_NAMES.WEB_SEARCH],
      ragQuery: ''
    };
  }

  // 4. RAG / Document Search & Analysis (Comprehensive triggers including typos and conversational references)
  const ragKeywords = [
    'resume', 'reusme', 'cv', 'portfolio',
    'document', 'doc', 'file', 'pdf', 'notes', 'paper', 'report',
    'upload', 'uploaded', 'attached',
    'iso', 'certification', 'company',
    'summarize', 'summary', 'extract', 'analyze', 'review',
    'what did i upload', 'in the document', 'from the file',
    'save all this data', 'structure this data', 'give me json'
  ];

  if (ragKeywords.some((kw) => lower.includes(kw))) {
    return {
      pipeline: ROUTER_TYPES.RAG,
      reasoning: 'User document / knowledge retrieval intent detected',
      toolsNeeded: [],
      ragQuery: clean
    };
  }

  // 5. LLM-assisted classification for complex multi-intent requests
  try {
    const prompt = ROUTER_CLASSIFIER_PROMPT.replace('{{userMessage}}', clean);
    const rawResponse = await generateLLMResponse({
      provider: MODEL_PROVIDERS.GEMINI,
      prompt,
      systemPrompt: 'You are an explicit JSON classifier. Respond strictly with raw JSON without markdown formatting.',
    });

    if (rawResponse) {
      // Non-greedy JSON extraction
      const jsonMatch = rawResponse.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.pipeline && Object.values(ROUTER_TYPES).includes(parsed.pipeline)) {
          return {
            pipeline: parsed.pipeline,
            reasoning: parsed.reasoning || 'LLM classified intent',
            toolsNeeded: Array.isArray(parsed.toolsNeeded) ? parsed.toolsNeeded : [],
            ragQuery: parsed.ragQuery || clean
          };
        }
      }
    }
  } catch (err) {
    logger.debug('Classifier', 'LLM classification skipped, using heuristic fallback:', { error: err.message });
  }

  return {
    pipeline: ROUTER_TYPES.CHAT,
    reasoning: 'General conversational reasoning intent',
    toolsNeeded: [],
    ragQuery: ''
  };
};

export default classifyUserIntent;
