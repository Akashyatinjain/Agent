import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../../config/env.js';

export const generateGeminiResponse = async ({ prompt, systemPrompt, history = [], onChunk = null }) => {
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY is not set in backend/.env file. Running in Mock Mode.');
    return sendMock(prompt, onChunk, 'Gemini');
  }

  // Validate API key format
  if (!apiKey.startsWith('AIzaSy')) {
    console.error('❌ Invalid GEMINI_API_KEY format. Valid keys start with "AIzaSy..."');
    console.error('   Get a free key from: https://aistudio.google.com/apikey');
    const errMsg = `⚠️ **Invalid Gemini API Key Format**\n\nYour key starts with \`${apiKey.substring(0, 5)}...\` but valid Google AI Studio keys start with \`AIzaSy...\`\n\n**How to get a valid key:**\n1. Go to [Google AI Studio](https://aistudio.google.com/apikey)\n2. Click "Create API Key"\n3. Copy the key (starts with \`AIzaSy...\`)\n4. Paste it in \`backend/.env\` as \`GEMINI_API_KEY=AIzaSy...\`\n5. Restart the backend server`;
    if (onChunk) onChunk(errMsg);
    return errMsg;
  }

  // Current model names (2025-2026 era)
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite', 
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      let fullPrompt = prompt;
      if (systemPrompt) {
        fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
      }

      if (onChunk) {
        const result = await model.generateContentStream(fullPrompt);
        let completeText = '';
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          completeText += chunkText;
          onChunk(chunkText);
        }
        return completeText;
      } else {
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
      }
    } catch (error) {
      console.warn(`⚠️ Model ${modelName} failed: ${error.message.substring(0, 100)}`);
      lastError = error;
    }
  }

  console.error('❌ All Gemini models failed:', lastError?.message);
  const errReply = `⚠️ **Gemini API Error:** ${lastError?.message || 'All models unavailable'}\n\n**Possible fixes:**\n- Verify your API key at [Google AI Studio](https://aistudio.google.com/apikey)\n- Check your API quota hasn't been exceeded\n- Ensure the key is not restricted to certain APIs`;
  if (onChunk) onChunk(errReply);
  return errReply;
};

function sendMock(prompt, onChunk, provider) {
  const mockReply = `Hello! I am **MiniGPT** (${provider} Mock Mode).\n\nYour message: "*${prompt}*"\n\nTo get live responses, set a valid \`GEMINI_API_KEY\` in \`backend/.env\`.\nGet one free at: https://aistudio.google.com/apikey`;
  if (onChunk) {
    onChunk(mockReply);
  }
  return mockReply;
}

export default generateGeminiResponse;
