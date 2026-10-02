import re
import json
from typing import Dict, Any

from app.ai.prompts.router import ROUTER_CLASSIFIER_PROMPT
from app.ai.llm.provider import get_llm_provider
from app.core.logging import logger

ROUTER_TYPES = {
    "CHAT": "chat",
    "RAG": "rag",
    "TOOL": "tool",
    "HYBRID": "hybrid"
}

TOOL_NAMES = {
    "CALCULATOR": "calculator",
    "WEATHER": "weather",
    "WEB_SEARCH": "web_search"
}

async def classify_user_intent(user_message: str) -> Dict[str, Any]:
    """Classify user query into chat, rag, tool, or hybrid pipeline."""
    if not user_message or not isinstance(user_message, str):
        return {
            "pipeline": ROUTER_TYPES["CHAT"],
            "reasoning": "Empty message defaulted to chat",
            "toolsNeeded": [],
            "ragQuery": ""
        }

    clean = user_message.strip()
    lower = clean.lower()

    # 1. Fast-path Math / Calculation
    if (
        re.match(r'^(?:calculate|compute|what is|evaluate|solve)\s+[\d\s+\-*/().,%eE]+$', lower)
        or re.match(r'^[\d\s+\-*/().,%eE]{3,}$', lower)
        or "calculate " in lower
        or "solve " in lower
    ):
        return {
            "pipeline": ROUTER_TYPES["TOOL"],
            "reasoning": "Mathematical calculation intent detected",
            "toolsNeeded": [TOOL_NAMES["CALCULATOR"]],
            "ragQuery": ""
        }

    # 2. Weather
    if any(k in lower for k in ("weather", "temperature", "forecast", "climate in")):
        return {
            "pipeline": ROUTER_TYPES["TOOL"],
            "reasoning": "Weather inquiry intent detected",
            "toolsNeeded": [TOOL_NAMES["WEATHER"]],
            "ragQuery": ""
        }

    # 3. Web Search / Live events
    if (
        lower.startswith("search ")
        or lower.startswith("google ")
        or any(k in lower for k in ("latest news", "who won ", "current stock price", "search the web for"))
    ):
        return {
            "pipeline": ROUTER_TYPES["TOOL"],
            "reasoning": "Live web search intent detected",
            "toolsNeeded": [TOOL_NAMES["WEB_SEARCH"]],
            "ragQuery": ""
        }

    # 4. RAG / Document Search
    rag_keywords = [
        "resume", "reusme", "cv", "portfolio",
        "document", "doc", "file", "pdf", "notes", "paper", "report",
        "upload", "uploaded", "attached",
        "iso", "certification", "company",
        "summarize", "summary", "extract", "analyze", "review",
        "what did i upload", "in the document", "from the file",
        "save all this data", "structure this data", "give me json"
    ]

    if any(kw in lower for kw in rag_keywords):
        return {
            "pipeline": ROUTER_TYPES["RAG"],
            "reasoning": "User document / knowledge retrieval intent detected",
            "toolsNeeded": [],
            "ragQuery": clean
        }

    # 5. Fast-path common conversational / coding / explanation intents to avoid 2s extra LLM classification latency
    chat_patterns = [
        "hi", "hello", "hey", "who are you", "what can you do", "help me",
        "write ", "explain ", "how to", "what is ", "why is ", "create ",
        "code ", "implement ", "refactor ", "fix ", "debug ", "tell me",
        "translate ", "convert ", "generate ", "draft ", "suggest ", "difference between"
    ]
    if any(p in lower for p in chat_patterns) or len(clean.split()) <= 4:
        return {
            "pipeline": ROUTER_TYPES["CHAT"],
            "reasoning": "Conversational / direct reasoning intent",
            "toolsNeeded": [],
            "ragQuery": ""
        }

    # 6. Fallback directly to CHAT for all conversational prompts without remote call
    return {
        "pipeline": ROUTER_TYPES["CHAT"],
        "reasoning": "Conversational intent",
        "toolsNeeded": [],
        "ragQuery": ""
    }
