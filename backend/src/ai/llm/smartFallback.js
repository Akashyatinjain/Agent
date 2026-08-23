/**
 * Smart Assistant Response Generator
 * Provides intelligent, structured responses when external API keys are pending or unconfigured.
 */
export const generateSmartFallbackResponse = async ({
  prompt = '',
  systemPrompt = '',
  history = [],
  onChunk = null,
  provider = 'AI'
}) => {
  const clean = prompt.trim();
  const lower = clean.toLowerCase();
  let reply = '';

  if (lower === 'hi' || lower === 'hello' || lower === 'hey') {
    reply = `Hello! 👋 I'm **MiniGPT**, your personal AI assistant. I'm ready to assist with daily tasks, coding, document synthesis, math computations, and live tool lookups. What can I help you with today?`;
  } else if (lower.includes('who are you') || lower.includes('what can you do')) {
    reply = `I am **MiniGPT**, an AI assistant built with an **Intelligent Intent Router Architecture**.\n\n` +
      `### Core Capabilities:\n` +
      `- 💬 **Direct Chat**: General knowledge, coding, logic, and creative problem solving.\n` +
      `- 📚 **pgvector RAG Retrieval**: Upload PDFs, notes, or documents to query against your personal knowledge base.\n` +
      `- 🛠️ **Live Tools**: Real-time weather lookups, web search queries, and safe arithmetic evaluation.\n` +
      `- 🧠 **Persistent Memory**: Automatically remembers personal facts and preferences across conversations.`;
  } else if (lower.includes('weather')) {
    reply = `I can lookup live weather updates for any city! Try asking: *"What is the weather in Tokyo?"* or *"Check weather in New York"*.`;
  } else if (lower.includes('calculate') || /^\d+\s*[\+\-\*\/]/.test(lower)) {
    reply = `MiniGPT includes a built-in mathematical evaluator! Try entering an arithmetic expression like \`125 * 8 - 45 / 5\`.`;
  } else {
    reply = `Thank you for your inquiry regarding: **"${clean}"**.\n\n` +
      `MiniGPT's Intent Router classified your request and synthesized this response. ` +
      `To connect live LLM inference with Google Gemini, OpenAI GPT-4o, or Mistral, ensure your respective API key is added in your backend configuration.`;
  }

  if (onChunk) {
    // Deliver response tokens smoothly
    const chunks = reply.match(/.{1,12}/g) || [reply];
    for (const chunk of chunks) {
      onChunk(chunk);
    }
  }

  return reply;
};

export default generateSmartFallbackResponse;
