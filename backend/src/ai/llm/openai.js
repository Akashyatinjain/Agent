import OpenAI from 'openai';
import env from '../../config/env.js';

export const generateOpenAIResponse = async ({ prompt, systemPrompt, history = [], onChunk = null }) => {
  const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ OPENAI_API_KEY is not set in backend/.env file. Running in Mock Mode.');
    const mockReply = `Hello! I am **MiniGPT** powered by OpenAI (Mock Mode).\n\nYour request: "*${prompt}*"\n\nTo activate real OpenAI GPT-4o responses, please configure \`OPENAI_API_KEY\` in your \`backend/.env\` file.`;
    if (onChunk) {
      const words = mockReply.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    }
    return mockReply;
  }

  try {
    const openai = new OpenAI({ apiKey });
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    history.forEach((msg) => {
      messages.push({ role: msg.role, content: msg.content });
    });

    messages.push({ role: 'user', content: prompt });

    if (onChunk) {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        stream: true,
      });

      let completeText = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          completeText += content;
          onChunk(content);
        }
      }
      return completeText;
    } else {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
      });
      return completion.choices[0]?.message?.content || '';
    }
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    const errReply = `⚠️ **OpenAI API Error:** ${error.message}\n\nPlease check your \`OPENAI_API_KEY\` in \`backend/.env\`. Make sure it's a valid key from OpenAI Platform (https://platform.openai.com/).`;
    if (onChunk) {
      onChunk(errReply);
    }
    return errReply;
  }
};

export default generateOpenAIResponse;
