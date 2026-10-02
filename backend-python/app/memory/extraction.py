import re
import json
from typing import Dict, Any, Optional

from app.ai.llm.provider import get_llm_provider
from app.core.logging import logger

async def extract_memories_from_conversation(
    user_message: str,
    assistant_response: str
) -> Dict[str, Any]:
    """Analyze conversation turn to extract personal facts/preferences for long-term memory."""
    prompt = f"""Analyze the following conversation turn. Extract any personal facts, preferences, goals, or lifestyle details mentioned by the user that would be useful for an AI assistant to remember for future conversations.

User: "{user_message}"
Assistant: "{assistant_response}"

If a personal fact is found, output JSON in this format:
{{
  "hasFact": true,
  "fact": "User works as a software developer in Bangalore",
  "category": "work" | "personal" | "preference" | "lifestyle"
}}

If no personal fact is mentioned, return:
{{ "hasFact": false }}"""

    try:
        provider = get_llm_provider("gemini")
        raw = await provider.generate(
            prompt=prompt,
            system_prompt="Output raw JSON only without markdown formatting."
        )

        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            parsed = json.loads(match.group(0))
            if parsed.get("hasFact") and parsed.get("fact"):
                return parsed
    except Exception as e:
        logger.warning(f"Memory extraction failed: {e}")

    return {"hasFact": False}
