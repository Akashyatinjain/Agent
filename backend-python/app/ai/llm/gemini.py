import asyncio
from typing import AsyncIterator, List, Dict, Any, Optional
import google.generativeai as genai

from app.core.config import settings
from app.core.logging import logger
from app.ai.llm.base import LLMProvider
from app.ai.llm.fallback import generate_smart_fallback, stream_smart_fallback

class GeminiProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.cached_model: Optional[str] = None
        if self.api_key:
            genai.configure(api_key=self.api_key)

    def _get_models(self) -> List[str]:
        # Fast-stream priority models (ADR-004 alignment)
        models = [
            'gemini-flash-lite-latest',
            'gemini-3.5-flash-lite',
            'gemini-flash-latest',
            'gemini-3.8-flash',
            'gemini-3.7-flash',
            'gemini-3.6-flash'
        ]
        if self.cached_model and self.cached_model in models:
            return [self.cached_model] + [m for m in models if m != self.cached_model]
        return models

    def _prepare_history(self, history: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        formatted = []
        if not history:
            return formatted
        for msg in history:
            role = (msg.get("role") or "").lower()
            content = msg.get("content") or ""
            if role in ("user", "assistant", "model"):
                gemini_role = "model" if role == "assistant" else "user"
                formatted.append({
                    "role": gemini_role,
                    "parts": [content]
                })
        # Gemini requires first turn to be 'user'
        while formatted and formatted[0]["role"] != "user":
            formatted.pop(0)
        return formatted

    async def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        history: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        if not self.api_key:
            logger.warning("GEMINI_API_KEY missing, using smart fallback")
            return await generate_smart_fallback(prompt, system_prompt, history, provider="Gemini")

        formatted_history = self._prepare_history(history)
        models = self._get_models()

        for model_name in models:
            try:
                system_instruction = system_prompt if system_prompt.strip() else None
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=system_instruction
                )

                req_opts = {"timeout": 10.0, "retry": None}
                if formatted_history:
                    chat = model.start_chat(history=formatted_history)
                    resp = await chat.send_message_async(prompt, request_options=req_opts)
                else:
                    resp = await model.generate_content_async(prompt, request_options=req_opts)

                text = resp.text
                if text and text.strip():
                    self.cached_model = model_name
                    return text
            except Exception as e:
                err_str = str(e)
                logger.warning(f"Gemini model {model_name} failed: {err_str}")
                if "ResourceExhausted" in err_str or "429" in err_str or "quota" in err_str.lower():
                    logger.warning("Gemini quota reached, breaking to fallback immediately")
                    break
                continue

        logger.error("All Gemini models failed, falling back to Smart Assistant")
        return await generate_smart_fallback(prompt, system_prompt, history, provider="Gemini")

    async def stream(
        self,
        prompt: str,
        system_prompt: str = "",
        history: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncIterator[str]:
        if not self.api_key:
            logger.warning("GEMINI_API_KEY missing, streaming smart fallback")
            async for chunk in stream_smart_fallback(prompt, system_prompt, history, provider="Gemini"):
                yield chunk
            return

        formatted_history = self._prepare_history(history)
        models = self._get_models()

        for model_name in models:
            try:
                system_instruction = system_prompt if system_prompt.strip() else None
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=system_instruction
                )
                req_opts = {"timeout": 12.0, "retry": None}

                yielded_any = False
                if formatted_history:
                    chat = model.start_chat(history=formatted_history)
                    resp = await chat.send_message_async(prompt, stream=True, request_options=req_opts)
                else:
                    resp = await model.generate_content_async(prompt, stream=True, request_options=req_opts)

                async for chunk in resp:
                    if chunk.text:
                        yield chunk.text
                        yielded_any = True

                if yielded_any:
                    self.cached_model = model_name
                    return
            except Exception as e:
                err_str = str(e)
                logger.warning(f"Gemini streaming {model_name} failed: {err_str}")
                if "ResourceExhausted" in err_str or "429" in err_str or "quota" in err_str.lower():
                    logger.warning("Gemini quota reached in streaming, breaking to fallback immediately")
                    break
                continue

        logger.error("All Gemini streaming models failed, falling back to Smart Assistant")
        async for chunk in stream_smart_fallback(prompt, system_prompt, history, provider="Gemini"):
            yield chunk
