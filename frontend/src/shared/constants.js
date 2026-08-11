/**
 * Shared constants for MiniGPT Frontend
 */

export const ROUTER_TYPES = {
  CHAT: 'chat',
  RAG: 'rag',
  TOOL: 'tool',
  HYBRID: 'hybrid'
};

export const MODEL_PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI: 'openai'
};

export const DEFAULT_MODELS = {
  GEMINI: 'gemini-1.5-flash',
  OPENAI: 'gpt-4o-mini'
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
