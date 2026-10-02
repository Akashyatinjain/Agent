from typing import AsyncIterator, List, Dict, Any, Optional
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.logging import logger
from app.ai.llm.base import LLMProvider
from app.ai.llm.fallback import generate_smart_fallback, stream_smart_fallback

class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        self.model = "gpt-4o-mini"

    def _prepare_messages(
        self,
        prompt: str,
        system_prompt: str = "",
        history: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, str]]:
        messages = []
        if system_prompt and system_prompt.strip():
            messages.append({"role": "system", "content": system_prompt})
        if history:
            for msg in history:
                role = (msg.get("role") or "").lower()
                content = msg.get("content") or ""
                if role in ("user", "assistant", "system"):
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": prompt})
        return messages

    async def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        history: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        if not self.client:
            return await generate_smart_fallback(prompt, system_prompt, history, provider="OpenAI")

        messages = self._prepare_messages(prompt, system_prompt, history)
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=False
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.warning(f"OpenAI error: {e}")
            return await generate_smart_fallback(prompt, system_prompt, history, provider="OpenAI")

    async def stream(
        self,
        prompt: str,
        system_prompt: str = "",
        history: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncIterator[str]:
        if not self.client:
            async for chunk in stream_smart_fallback(prompt, system_prompt, history, provider="OpenAI"):
                yield chunk
            return

        messages = self._prepare_messages(prompt, system_prompt, history)
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True
            )
            async for chunk in response:
                content = chunk.choices[0].delta.content if chunk.choices else ""
                if content:
                    yield content
        except Exception as e:
            logger.warning(f"OpenAI stream error: {e}")
            async for chunk in stream_smart_fallback(prompt, system_prompt, history, provider="OpenAI"):
                yield chunk
