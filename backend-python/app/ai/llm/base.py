from abc import ABC, abstractmethod
from typing import AsyncIterator, List, Dict, Any, Optional

class LLMProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        history: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Generate complete LLM response."""
        pass

    @abstractmethod
    async def stream(
        self,
        prompt: str,
        system_prompt: str = "",
        history: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncIterator[str]:
        """Stream LLM response chunk by chunk."""
        pass
