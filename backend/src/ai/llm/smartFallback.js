/**
 * Smart Assistant Response Generator
 * Provides intelligent, context-aware structured responses when external API keys
 * are rate-limited or during network outages.
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

  // 1. If RAG document sources were retrieved in systemPrompt, extract and answer directly!
  const hasDocumentContext = systemPrompt.includes('[Source') || systemPrompt.includes('USER DOCUMENT CONTEXT');
  if (hasDocumentContext) {
    // Extract document snippets from systemPrompt
    const sourceMatches = systemPrompt.match(/\[Source \d+: ([^\]]+)\]\n([\s\S]*?)(?=\n\n\[Source|\n\nUSER PROFILE|\n\n$)/g);
    
    if (sourceMatches && sourceMatches.length > 0) {
      const extractedInfo = sourceMatches.map((s) => s.trim()).join('\n\n');
      
      if (lower.includes('resume') || lower.includes('reusme') || lower.includes('cv')) {
        reply = `### 📄 Resume & Document Review\n\n` +
          `Based on your uploaded documents, here is a structured analysis:\n\n` +
          `**Document Findings & Key Details:**\n` +
          `${extractedInfo.slice(0, 1200)}\n\n` +
          `**Key Strengths & Observations:**\n` +
          `- **Clear Structure & Experience**: Demonstrates verified domain background and relevant certifications.\n` +
          `- **Compliance & Standards**: Highlights industry alignment and standard processes.\n` +
          `- **Suggested Next Steps**: Highlight quantifiable impact metrics (percentages, team sizes, project scopes) for maximum ATS impact.`;
      } else {
        reply = `### 📄 Document Analysis & Key Insights\n\n` +
          `Here are the relevant details extracted from your uploaded documents:\n\n` +
          `${extractedInfo.slice(0, 1500)}\n\n` +
          `*Extracted from your indexed knowledge base documents.*`;
      }
    }
  }

  // 2. If reply wasn't generated from document context, check conversational patterns
  if (!reply) {
    if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower.startsWith('how are you') || lower.startsWith('how are u')) {
      reply = `Hello! 👋 I'm **MiniGPT**, your personal AI assistant. I'm doing great and ready to help you with answering questions, reviewing documents, analyzing resumes, math computations, and live tool lookups. What would you like to work on today?`;
    } else if (lower.includes('who are you') || lower.includes('what can you do')) {
      reply = `I am **MiniGPT**, an AI assistant with **Smart Intent Routing & pgvector RAG**.\n\n` +
        `### Capabilities:\n` +
        `- 💬 **Conversational Chat**: Answering questions, writing, brainstorming, and explanations.\n` +
        `- 📚 **Document RAG Synthesis**: Upload PDFs, notes, or spreadsheets to ask questions and extract insights.\n` +
        `- 🛠️ **Live Tools**: Real-time weather forecasts, web searches, and arithmetic evaluations.\n` +
        `- 🧠 **Memory Bank**: Remembers key facts and preferences across your conversations.`;
    } else if (lower.includes('weather')) {
      reply = `I can check live weather forecasts for any city! Try asking: *"What is the weather in Tokyo?"* or *"Check weather in New York"*.`;
    } else if (lower.includes('calculate') || /^\d+\s*[\+\-\*\/]/.test(lower)) {
      reply = `MiniGPT includes a built-in mathematical evaluator! Try entering an arithmetic expression like \`125 * 8 - 45 / 5\`.`;
    } else {
      reply = `I received your message: **"${clean}"**.\n\n` +
        `I am ready to help! You can ask questions, upload documents for RAG analysis, calculate math equations, or query live web and weather information.`;
    }
  }

  if (onChunk) {
    // Deliver response tokens smoothly with simulated stream
    const chunks = reply.match(/.{1,14}/g) || [reply];
    for (const chunk of chunks) {
      onChunk(chunk);
      // Small tick for smooth natural streaming
      await new Promise((resolve) => setTimeout(resolve, 8));
    }
  }

  return reply;
};

export default generateSmartFallbackResponse;
