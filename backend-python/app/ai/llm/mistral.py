import json
from typing import AsyncIterator, List, Dict, Any, Optional
import httpx

from app.core.config import settings
from app.core.logging import logger
from app.ai.llm.base import LLMProvider
from app.ai.llm.fallback import generate_smart_fallback, stream_smart_fallback

class MistralProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.MISTRAL_API_KEY
        self.models = [
            'mistral-small-latest',
            'mistral-medium-latest',
            'open-mistral-7b'
        ]

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
        if not self.api_key:
            logger.warning("MISTRAL_API_KEY missing, using smart fallback")
            return await generate_smart_fallback(prompt, system_prompt, history, provider="Mistral")

        messages = self._prepare_messages(prompt, system_prompt, history)

        async with httpx.AsyncClient(timeout=45.0) as client:
            for model_name in self.models:
                try:
                    response = await client.post(
                        "https://api.mistral.ai/v1/chat/completions",
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"Bearer {self.api_key}"
                        },
                        json={
                            "model": model_name,
                            "messages": messages,
                            "stream": False
                        }
                    )
                    if response.status_code == 200:
                        data = response.json()
                        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                        if content:
                            return content
                    else:
                        logger.warning(f"Mistral model {model_name} HTTP {response.status_code}")
                except Exception as e:
                    logger.warning(f"Mistral {model_name} error: {e}")
                    continue

        return await generate_smart_fallback(prompt, system_prompt, history, provider="Mistral")

    async def stream(
        self,
        prompt: str,
        system_prompt: str = "",
        history: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncIterator[str]:
        if not self.api_key:
            logger.warning("MISTRAL_API_KEY missing, streaming smart fallback")
            async for chunk in stream_smart_fallback(prompt, system_prompt, history, provider="Mistral"):
                yield chunk
            return

        messages = self._prepare_messages(prompt, system_prompt, history)

        for model_name in self.models:
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream(
                        "POST",
                        "https://api.mistral.ai/v1/chat/completions",
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"Bearer {self.api_key}"
                        },
                        json={
                            "model": model_name,
                            "messages": messages,
                            "stream": True
                        }
                    ) as response:
                        if response.status_code != 200:
                            logger.warning(f"Mistral streaming {model_name} HTTP {response.status_code}")
                            continue

                        yielded_anything = False
                        async for line in response.aiter_lines():
                            line = line.strip()
                            if not line or line == "data: [DONE]":
                                continue
                            if line.startswith("data: "):
                                try:
                                    payload = json.loads(line[6:])
                                    chunk = payload.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                    if chunk:
                                        yield chunk
                                        yielded_anything = True
                                except Exception:
                                    pass

                        if yielded_anything:
                            return
            except Exception as e:
                logger.warning(f"Mistral stream error {model_name}: {e}")
                continue

        async for chunk in stream_smart_fallback(prompt, system_prompt, history, provider="Mistral"):
            yield chunk
