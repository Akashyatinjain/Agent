import math
import asyncio
from typing import List
import google.generativeai as genai
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.logging import logger

TARGET_DIMENSION = 1536

def normalize_vector(vec: List[float]) -> List[float]:
    """Normalize vector to unit length (L2 norm = 1)."""
    norm = math.sqrt(sum(v * v for v in vec))
    if norm == 0:
        return vec
    return [v / norm for v in vec]

def generate_deterministic_vector(text: str) -> List[float]:
    """Fast deterministic pseudo-semantic vector generator for offline fallback."""
    vec = [0.0] * TARGET_DIMENSION
    clean = text.lower().strip()

    # N-gram hashing
    for i in range(len(clean) - 2):
        code = ord(clean[i]) * 31 + ord(clean[i + 1]) * 17 + ord(clean[i + 2])
        idx = abs(code) % TARGET_DIMENSION
        vec[idx] += 1.0

    # Word-level hashing
    words = clean.split()
    for w in words:
        word_hash = 0
        for c in w:
            word_hash = ((word_hash << 5) - word_hash) + ord(c)
            word_hash &= 0xFFFFFFFF
        idx = abs(word_hash) % TARGET_DIMENSION
        vec[idx] += 2.0

    return normalize_vector(vec)

async def generate_embedding(text: str) -> List[float]:
    """Generate 1536-dimensional embedding vector."""
    if not text or not text.strip():
        return [0.0] * TARGET_DIMENSION

    clean_text = text[:8000]

    # 1. Try OpenAI text-embedding-3-small (native 1536d)
    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip():
        try:
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            resp = await client.embeddings.create(
                model="text-embedding-3-small",
                input=clean_text,
                dimensions=TARGET_DIMENSION
            )
            if resp.data and resp.data[0].embedding:
                return normalize_vector(resp.data[0].embedding)
        except Exception as e:
            logger.warning(f"OpenAI embedding error: {e}")

    # 2. Try Gemini text-embedding-004
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        for model_name in ('text-embedding-004', 'embedding-001'):
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                result = await asyncio.to_thread(
                    genai.embed_content,
                    model=f"models/{model_name}",
                    content=clean_text
                )
                values = result.get("embedding", [])
                if values:
                    # Project/expand smoothly to 1536 dimensions
                    v1536 = [0.0] * TARGET_DIMENSION
                    val_len = len(values)
                    for i in range(TARGET_DIMENSION):
                        scale = 1.0 + (0.05 if i >= val_len else 0.0)
                        v1536[i] = values[i % val_len] * scale
                    return normalize_vector(v1536)
            except Exception as e:
                logger.warning(f"Gemini embedding model {model_name} error: {e}")

    # 3. Deterministic unit vector fallback
    return generate_deterministic_vector(clean_text)

async def generate_batch_embeddings(texts: List[str], batch_size: int = 8) -> List[List[float]]:
    """Generate embeddings for a list of text chunks in batches."""
    results = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        tasks = [generate_embedding(t) for t in batch]
        batch_results = await asyncio.gather(*tasks)
        results.extend(batch_results)
    return results
