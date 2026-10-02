from typing import Optional
from app.ai.llm.base import LLMProvider
from app.ai.llm.gemini import GeminiProvider
from app.ai.llm.mistral import MistralProvider
from app.ai.llm.openai_provider import OpenAIProvider
from app.ai.llm.groq import GroqProvider

_gemini_instance = None
_mistral_instance = None
_openai_instance = None
_groq_instance = None

def get_llm_provider(provider_name: Optional[str] = "gemini") -> LLMProvider:
    """Retrieve singleton LLM provider based on model/provider name."""
    global _gemini_instance, _mistral_instance, _openai_instance, _groq_instance

    name = (provider_name or "gemini").lower()

    if "mistral" in name:
        if _mistral_instance is None:
            _mistral_instance = MistralProvider()
        return _mistral_instance
    elif "openai" in name or "gpt" in name:
        if _openai_instance is None:
            _openai_instance = OpenAIProvider()
        return _openai_instance
    elif "groq" in name or "llama" in name:
        if _groq_instance is None:
            _groq_instance = GroqProvider()
        return _groq_instance
    else:
        if _gemini_instance is None:
            _gemini_instance = GeminiProvider()
        return _gemini_instance
