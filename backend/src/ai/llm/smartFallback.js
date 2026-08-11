/**
 * Smart Intelligent Assistant Response Generator for MiniGPT
 * Generates natural responses when external API keys are unconfigured, invalid, or rate-limited.
 */
export const generateSmartFallbackResponse = async ({ prompt, systemPrompt, history = [], onChunk = null, provider = 'Gemini' }) => {
  const lower = prompt.toLowerCase().trim();
  let reply = '';

  if (lower === 'hi' || lower === 'hello' || lower === 'hey') {
    reply = `Hello! 👋 I'm **MiniGPT**, your personal AI assistant. How can I help solve your problems or assist with your work today?`;
  } else if (lower.includes('who are you') || lower.includes('what can you do')) {
    reply = `I am **MiniGPT**, an intelligent AI assistant built with a multi-pipeline **Router Architecture**:\n\n` +
      `- 💬 **Direct Chat**: Answering general questions and brainstorming ideas.\n` +
      `- 📚 **pgvector RAG Search**: Upload PDFs/documents to ask questions against your knowledge base.\n` +
      `- 🛠️ **Live API Tools**: Perform real-time web searches, weather lookups, and math calculations.`;
  } else if (lower.includes('weather')) {
    reply = `I can check live weather updates for any city using the MiniGPT Weather Tool! Try asking *"What is the weather in Tokyo?"* or *"Weather forecast for Mumbai"*.`;
  } else if (lower.includes('calculate') || /^\d+\s*[\+\-\*\/]/.test(lower)) {
    reply = `I have a built-in math evaluator tool! Try typing expressions like \`25 * 4\` or \`100 / 5\`.`;
  } else {
    reply = `That's an interesting topic regarding "${prompt}".\n\n` +
      `As **MiniGPT**, I can process your request through our AI Intent Router. ` +
      `Whether you need strategic advice, code analysis, or document synthesis, I'm ready to assist you. What specific details would you like to explore further?`;
  }

  // Add subtle notice
  reply += `\n\n*([${provider} Mode] To enable live API calls, set a valid key starting with AIzaSy in backend/.env)*`;

  if (onChunk) {
    const words = reply.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }

  return reply;
};

export default generateSmartFallbackResponse;
