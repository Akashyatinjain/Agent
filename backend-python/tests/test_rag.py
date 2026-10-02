import pytest
from app.rag.chunking import chunk_text
from app.rag.embeddings import generate_embedding, normalize_vector, TARGET_DIMENSION
from app.rag.reranking import rerank_chunks
from app.rag.store import in_memory_store

def test_chunking():
    sample_text = ("This is a paragraph about AI assistants. It explains how routing works.\n\n" * 10)
    chunks = chunk_text(sample_text, chunk_size=200, overlap=30)
    assert len(chunks) > 1
    assert all(len(c) >= 30 for c in chunks)

@pytest.mark.asyncio
async def test_embeddings():
    vec = await generate_embedding("Hello world test query")
    assert len(vec) == TARGET_DIMENSION
    assert isinstance(vec[0], float)

def test_reranking():
    chunks = [
        {"id": "1", "content": "Database indexing B-tree optimization", "similarity": 0.5},
        {"id": "2", "content": "Weather forecast in London", "similarity": 0.7}
    ]
    reranked = rerank_chunks(chunks, "B-tree database indexing")
    assert reranked[0]["id"] == "1"
    assert reranked[0]["rerankScore"] > reranked[1]["rerankScore"]
