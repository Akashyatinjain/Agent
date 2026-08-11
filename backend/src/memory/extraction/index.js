import { generateLLMResponse } from '../../ai/llm/provider.js';
import { MODEL_PROVIDERS } from '../../shared/constants.js';

export const extractMemoriesFromConversation = async (userMessage, assistantResponse) => {
  const prompt = `Analyze the following conversation turn. Extract any personal facts, preferences, goals, or lifestyle details mentioned by the user that would be useful for an AI assistant to remember for future conversations.

User: "${userMessage}"
Assistant: "${assistantResponse}"

If a personal fact is found, output JSON in this format:
{
  "hasFact": true,
  "fact": "User works as a software developer in Bangalore",
  "category": "work" | "personal" | "preference" | "lifestyle"
}

If no personal fact is mentioned, return:
{ "hasFact": false }`;

  try {
    const raw = await generateLLMResponse({
      provider: MODEL_PROVIDERS.GEMINI,
      prompt,
      systemPrompt: 'Output raw JSON only.'
    });

    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.hasFact && parsed.fact) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore extraction errors quietly
  }

  return { hasFact: false };
};

export default extractMemoriesFromConversation;
