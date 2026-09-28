
export const ROUTER_TYPES = {
  CHAT: 'chat',
  RAG: 'rag',
  TOOL: 'tool',
  HYBRID: 'hybrid'
};

export const MODEL_PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  MISTRAL: 'mistral'
};

export const DEFAULT_MODELS = {
  GEMINI: 'gemini-flash-lite-latest',
  MISTRAL: 'mistral-small-latest'
};

export const TOOL_NAMES = {
  WEB_SEARCH: 'web_search',
  CALCULATOR: 'calculator',
  WEATHER: 'weather'
};

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
};

export const FILE_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export default {
  ROUTER_TYPES,
  MODEL_PROVIDERS,
  DEFAULT_MODELS,
  TOOL_NAMES,
  MESSAGE_ROLES,
  FILE_STATUS
};
