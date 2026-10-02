# AkashAgent Python Backend

Modern, async Python backend for **AkashAgent** built with **FastAPI**, **SQLAlchemy 2.0**, **asyncpg**, and **pgvector**. Fully replaces the Node.js/Express backend while maintaining 100% API compatibility with the React frontend.

---

## Architecture & Features

- **FastAPI Framework**: High performance async ASGI server with Pydantic v2 data validation and OpenAPI docs at `/docs`.
- **Database & Vector Storage**: SQLAlchemy 2.0 async engine with PostgreSQL `asyncpg` driver and `pgvector` for document similarity search (`<=>` cosine distance).
- **Authentication**: Bcrypt cost 12 hashing compatible with Node.js hashes (`$2a$` / `$2b$`) + HS256 JWT tokens.
- **Multi-Model LLM Routing**:
  - Gemini (2.5-flash / 1.5-pro)
  - Mistral (mistral-large / mistral-small)
  - OpenAI (gpt-4o / gpt-4o-mini)
  - Groq (llama-3.3-70b-versatile)
  - Resilient Smart Fallback Assistant if remote provider quotas/limits are reached
- **Dynamic Intent Routing**:
  - `rag`: Semantic search against user documents
  - `tool`: Real-time calculator (AST safe math, no `eval`), weather (OpenWeatherMap), web search (SerpAPI)
  - `coding`: Technical deep-dive system prompt
  - `general`: Standard conversational response
- **Server-Sent Events (SSE)**: True async streaming delivering exact event shapes expected by the React frontend (`metadata`, `router_intent`, `token`, `error`, `end`, keepalive heartbeat).
- **Background Tasks**: Assistant message persistence and LLM fact/memory extraction run non-blockingly via `asyncio.create_task`.
- **Document & RAG Pipeline**: Ingestion for PDF, DOCX, CSV, JSON, and TXT files with paragraph-aware chunking and hybrid semantic + lexical reranking.
- **Storage**: AWS S3 with local disk storage fallback (`uploads/`).

---

## Quickstart

### 1. Setup Virtual Environment
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment Variables
Copy `.env` into `backend-python/.env` (or configure your Neon PostgreSQL database URL and API keys):
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
DATABASE_URL=postgresql://...
JWT_SECRET=minigpt_super_secret_jwt_key_2026_dev
```

### 3. Run Development Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

### 4. Run Test Suite
```bash
pytest -v
```
