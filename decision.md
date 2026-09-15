# Architecture & Code Decision Records (ADR)
**Project:** MiniGPT / AkashAgent  
**Last Updated:** September 15, 2026  
**Status:** Living Document  

This document logs all foundational architectural decisions, library selections, and code modifications made in the project. It details the **context**, the **problem**, the **chosen approach**, the **reasons behind it**, and **alternatives considered**.

---

## 📑 Table of Contents
1. [Core Technology Stack & Library Selection](#1-core-technology-stack--library-selection)
2. [Architectural Principles & Patterns](#2-architectural-principles--patterns)
3. [Decision Records Log (ADR)](#3-decision-records-log-adr)
   - [ADR-001: Automatic Origin & Zombie Service Worker Cleanup](#adr-001-automatic-origin--zombie-service-worker-cleanup)
   - [ADR-002: Dual Route Mounting (/api/user and /api/users) & Route Aliasing](#adr-002-dual-route-mounting-apiuser-and-apiusers--route-aliasing)
   - [ADR-003: Prisma User Schema Password Field Normalization](#adr-003-prisma-user-schema-password-field-normalization)
   - [ADR-004: LLM Model Deprecation Migration & Fast-Stream Priority](#adr-004-llm-model-deprecation-migration--fast-stream-priority)
   - [ADR-005: Prisma File Model Query Field Alignment](#adr-005-prisma-file-model-query-field-alignment)
   - [ADR-006: Server-Sent Events (SSE) vs WebSockets for AI Streaming](#adr-006-server-sent-events-sse-vs-websockets-for-ai-streaming)
   - [ADR-007: Multi-Tier Smart Fallback & Graceful Degradation](#adr-007-multi-tier-smart-fallback--graceful-degradation)
   - [ADR-008: Dual Storage Engine (Local Disk Buffer + AWS S3)](#adr-008-dual-storage-engine-local-disk-buffer--aws-s3)
   - [ADR-009: MessageRole Enum Casing Alignment & Multi-turn Conversation Memory Persistence](#adr-009-messagerole-enum-casing-alignment--multi-turn-conversation-memory-persistence)
4. [Guidelines for Future Decision Logging](#4-guidelines-for-future-decision-logging)

---

## 1. Core Technology Stack & Library Selection

| Layer | Technology / Library | Why Chosen | Alternatives Considered & Why Rejected |
|---|---|---|---|
| **Backend Runtime** | **Node.js (ES Modules)** | Native `import`/`export` across codebase, zero transpilation step, high I/O throughput for concurrent streams. | CommonJS (`require`) was avoided due to modern standard alignment and cleaner package interop. |
| **Server Framework** | **Express.js (v4.19)** | Battle-tested, minimal overhead, unopinionated routing, seamless integration with custom SSE streams and standard middleware. | **Fastify**: Faster for raw microbenchmarks, but added complexity with SSE piping and plugin lifecycle; **NestJS**: Excessive boilerplate and decorators for an agentic micro-app. |
| **Database & ORM** | **PostgreSQL (Neon) + Prisma ORM** | Neon offers instant serverless branching and zero cold-start vector indexing; Prisma provides type-safe query generation, migration tooling, and clean relation modeling. | **TypeORM / Sequelize**: Less type-safety and more configuration friction; **Drizzle**: Lacked pre-built automated studio and migrations were less hands-free during rapid prototyping. |
| **Vector Search** | **PostgreSQL `pgvector` extension** | Eliminates the need for an external vector database (e.g. Pinecone/Chroma/Weaviate). Relational data (users, files, conversations) and vector embeddings (1536-dim) live in the **same transactional database**. | **Pinecone / Milvus**: Separate infrastructure, separate billing, network latency overhead, and synchronization headache between SQL IDs and vector IDs. |
| **AI SDK** | **`@google/generative-ai` & `openai`** | Official SDKs maintain up-to-date protocol support, automatic retries, and token accounting for Gemini and OpenAI. | LangChain: High abstraction overhead, frequent breaking changes, difficult to inspect raw SSE streams. |
| **Auth & Security** | **`jsonwebtoken` + `bcryptjs`** | Stateless JWT authentication allows horizontal scaling without session stores; `bcryptjs` is a pure JS implementation of bcrypt preventing binary compilation issues on Windows. | **native `bcrypt`**: Requires Python and C++ build tools on Windows which fail in many developer environments; **Session cookies**: Harder to proxy across multi-domain Vercel/Render deployments. |
| **Frontend Framework** | **React 18 + Vite** | Instant Hot Module Replacement (HMR), lightweight bundle outputs, modern React hooks (`useState`, `useEffect`, `useRef`) for stream rendering. | **Next.js**: SSR and server components add unnecessary complexity for a SPA connecting to a decoupled Express backend. |
| **Frontend Styling** | **Tailwind CSS v4 (`@tailwindcss/vite`)** | Zero-config CSS variables theme engine, atomic utilities without bloated stylesheets, native Vite plugin with lightning-fast rebuild times. | Tailwind v3 (requires PostCSS and separate config file) or Plain CSS (slower UI development velocity). |
| **Frontend State** | **Zustand** | Minimal boilerplate (no reducers or action dispatchers), hook-based consumption, no context provider re-render waterfalls, simple `localStorage` persistence. | **Redux Toolkit**: Too much boilerplate; **React Context**: Causes entire tree re-renders when streaming frequent token chunks. |
| **HTTP Client** | **Axios (with Interceptors)** | Automatic JSON parsing, unified timeout configuration, and centralized request interceptors for injecting `Authorization: Bearer <token>`. | Native `fetch`: Lacks declarative interceptor pipelines, requiring manual token injection and repetitive error unpacking. |

---

## 2. Architectural Principles & Patterns

### 2.1 Intent Router Architecture
Instead of sending every prompt directly to an expensive LLM, the backend uses an **Intent Classifier** (`backend/src/ai/router/classifier.js`):
- **Chat Pipeline**: Direct LLM conversational response.
- **RAG Pipeline**: Vector similarity retrieval from user uploaded documents, reranking, and grounded prompt injection.
- **Tool Pipeline**: Structured tool calling for live deterministic computation (Calculator, SerpAPI Search, OpenWeather).
- **Hybrid Pipeline**: Combined tool execution + document retrieval synthesis.

### 2.2 Unified Streaming Protocol (SSE)
All chat completions use Server-Sent Events (`text/event-stream`). 
- Events emitted: `meta` (pipeline info, tool calls), `token` (streamed chunks), `done` (stats and final conversation ID), and `error`.
- SSE uses standard HTTP, allowing it to traverse corporate proxies, firewalls, and CDNs without the handshake failures common to WebSockets.

---

## 3. Decision Records Log (ADR)

### ADR-001: Automatic Origin & Zombie Service Worker Cleanup
- **Date:** 2026-09-15
- **Files Modified:** [`frontend/src/main.jsx`](file:///c:/AkashAgent/frontend/src/main.jsx)
- **Context:**
  Developers frequently run multiple web projects on the same local port (`http://localhost:5173`). A previously developed PWA project (`Budget-tracker`) registered a Service Worker (`sw.js`) and filled Cache Storage for `localhost:5173`.
- **Problem:**
  When `AkashAgent` was launched on `localhost:5173`, the browser was still controlled by the old `Budget-tracker` service worker. It intercepted requests, crashed on Chrome Extension calls (`Failed to execute 'put' on 'Cache': Request scheme 'chrome-extension' is unsupported`), and tried to connect to dead Socket.io endpoints.
- **Decision:**
  Added an automated startup cleanup script in `main.jsx` that queries `navigator.serviceWorker.getRegistrations()` and unregisters all active workers, followed by deleting all keys in `window.caches`.
- **Reasoning:**
  This guarantees that development on `localhost` is completely isolated from other applications without requiring the user to manually dive into Chrome DevTools Application tab.

---

### ADR-002: Dual Route Mounting (/api/user and /api/users) & Route Aliasing
- **Date:** 2026-09-15
- **Files Modified:** [`backend/src/index.js`](file:///c:/AkashAgent/backend/src/index.js), [`backend/src/users/routes.js`](file:///c:/AkashAgent/backend/src/users/routes.js)
- **Context:**
  Different components across the frontend consumed user-related endpoints. Some components called singular `/api/user/profile`, while feature components like [`KnowledgeBase.jsx`](file:///c:/AkashAgent/frontend/src/features/knowledge/KnowledgeBase.jsx) called plural `/api/users/memories`, and standard JWT auth convention often uses `/me`.
- **Problem:**
  `backend/src/index.js` strictly mounted `userRoutes` at `/api/user`. Calls to `/api/users/*` returned 404 `ROUTE_NOT_FOUND`.
- **Decision:**
  Mounted `userRoutes` on both `/api/user` and `/api/users` in `index.js`, and added `/me` alongside `/profile` in `users/routes.js`.
- **Reasoning:**
  API ergonomics and resilience. Supporting both singular and plural REST idioms avoids brittle frontend regressions and ensures third-party or legacy endpoints gracefully resolve.

---

### ADR-003: Prisma User Schema Password Field Normalization
- **Date:** 2026-09-15
- **Files Modified:** [`backend/src/auth/controller.js`](file:///c:/AkashAgent/backend/src/auth/controller.js)
- **Context:**
  In Prisma schema ([`schema.prisma`](file:///c:/AkashAgent/backend/prisma/schema.prisma)), the `User` model column is named `hashedPassword String`.
- **Problem:**
  The `register` controller was passing `passwordHash: hashedPassword` to `prisma.user.create()`. Because `passwordHash` does not exist on the Prisma model and `hashedPassword` is a required non-nullable field, Prisma threw `Argument 'hashedPassword' is missing` and aborted user registration.
- **Decision:**
  1. Updated `prisma.user.create()` to pass `hashedPassword: hashedPassword`.
  2. Updated demo user upsert to use `hashedPassword`.
  3. Updated login validation to check `const storedHash = user.hashedPassword || user.passwordHash` for defensive backward-compatibility.
- **Reasoning:**
  Ensures strict schema adherence with PostgreSQL while guaranteeing robust authentication verification.

---

### ADR-004: LLM Model Deprecation Migration & Fast-Stream Priority
- **Date:** 2026-09-15
- **Files Modified:** [`backend/src/ai/llm/gemini.js`](file:///c:/AkashAgent/backend/src/ai/llm/gemini.js), [`backend/src/shared/constants.js`](file:///c:/AkashAgent/backend/src/shared/constants.js)
- **Context:**
  The AI was responding with placeholder text: *"I received your message: ... I am ready to help!"*.
- **Problem:**
  `backend/src/ai/llm/gemini.js` had hardcoded legacy models (`gemini-1.5-flash-latest`, `gemini-1.5-flash`, `gemini-2.0-flash-exp`, `gemini-2.5-flash`). Google Generative AI API deprecated these models, returning `404 Not Found` or `404 Model is no longer available to new users`. After exhausting all model names, the backend fell back to [`smartFallback.js`](file:///c:/AkashAgent/backend/src/ai/llm/smartFallback.js).
- **Decision:**
  1. Discovered active model catalog using the Google AI Model Service API.
  2. Placed `gemini-flash-lite-latest` and `gemini-3.5-flash-lite` at the top of `modelsToTry`, followed by `gemini-flash-latest`.
  3. Updated `DEFAULT_MODELS.GEMINI` in `constants.js` to `gemini-flash-lite-latest`.
- **Reasoning:**
  - `gemini-flash-lite-latest` and `gemini-3.5-flash-lite` have zero 503 high-demand spikes, generous free tier quotas, and deliver instant SSE streaming (~1.5 to 3.5 seconds).
  - Heavy reasoning/thinking models (`gemini-3.6-flash`) introduce long latency before first token; flash-lite guarantees immediate interactivity for chat.

---

### ADR-005: Prisma File Model Query Field Alignment
- **Date:** 2026-09-15
- **Files Modified:** [`backend/src/ai/router/index.js`](file:///c:/AkashAgent/backend/src/ai/router/index.js)
- **Context:**
  Before executing an intent pipeline, the router queries the database for user-uploaded documents to inform the system prompt.
- **Problem:**
  The query contained `select: { id: true, name: true, size: true, chunkCount: true }`. The field `chunkCount` does not exist on the `File` model in `schema.prisma`, causing Prisma runtime query errors.
- **Decision:**
  Replaced `chunkCount: true` with `type: true` to align with the valid Prisma schema attributes.
- **Reasoning:**
  Eliminates query validation exceptions and prevents silent failure inside the intent router.

---

### ADR-006: Server-Sent Events (SSE) vs WebSockets for AI Streaming
- **Date:** Inception Architectural Decision
- **Component:** `backend/src/ai/streaming/sse.js`
- **Context:**
  LLM token generation is fundamentally unidirectional (server streams tokens to client once the client submits a prompt).
- **Decision:**
  Adopt HTTP Server-Sent Events (`text/event-stream`) instead of full-duplex WebSockets.
- **Reasoning:**
  1. **Simplicity:** Operates on standard HTTP/1.1 and HTTP/2; no socket handshakes, heartbeat pings, or connection state stores.
  2. **Firewall & Proxy Compatibility:** Seamlessly proxies through Vercel serverless edges, Render backends, and Nginx without special upgrade headers.
  3. **Auto-Reconnection:** Browser EventSource / fetch stream readers natively handle reconnection and boundary parsing.

---

### ADR-007: Multi-Tier Smart Fallback & Graceful Degradation
- **Date:** Inception Architectural Decision
- **Component:** `backend/src/ai/llm/smartFallback.js`
- **Context:**
  External AI provider APIs (Google, OpenAI, Mistral) are subject to billing caps, rate limits (429), or cloud provider outages (503).
- **Decision:**
  Implement a layered fallback:
  1. Primary Provider (Gemini).
  2. Secondary Provider (OpenAI).
  3. Tertiary Provider (Mistral).
  4. Local Smart Fallback (`smartFallback.js`) capable of rule-based document summarization and clean UI feedback.
- **Reasoning:**
  Guarantees that the application never throws an uncaught white-screen error or unhandled 500 server crash, maintaining system uptime and user experience.

---

### ADR-008: Dual Storage Engine (Local Disk Buffer + AWS S3)
- **Date:** Inception Architectural Decision
- **Component:** `backend/src/files/service.js`
- **Context:**
  Local development should run zero-config without requiring AWS credentials, while production deployments on ephemeral containers (e.g. Render/Railway) require persistent cloud object storage.
- **Decision:**
  Designed storage as a hybrid adapter:
  - If `AWS_ACCESS_KEY_ID` and `AWS_S3_BUCKET` are provided, documents are stored in Amazon S3 with presigned URLs.
  - If AWS credentials are blank (default in development), files automatically fall back to local disk storage (`backend/uploads/`).
- **Reasoning:**
  Zero developer friction out of the box with zero required cloud accounts, while maintaining production readiness.

---

### ADR-009: MessageRole Enum Casing Alignment & Multi-turn Conversation Memory Persistence
- **Date:** 2026-09-15
- **Files Modified:** [`backend/src/chat/controller.js`](file:///c:/AkashAgent/backend/src/chat/controller.js), [`backend/src/ai/llm/gemini.js`](file:///c:/AkashAgent/backend/src/ai/llm/gemini.js), [`frontend/src/features/chat/MessageBubble.jsx`](file:///c:/AkashAgent/frontend/src/features/chat/MessageBubble.jsx)
- **Context:**
  When a user asked a follow-up question (e.g., *"in short me bol na"*), the AI replied generically (*"Bilkul, ab se har baat short aur direct hogi. Boliye, kya help chahiye?"*) without referencing the previous answer.
- **Problem:**
  1. In `prisma/schema.prisma`, `MessageRole` is defined as an uppercase enum (`USER`, `ASSISTANT`, `SYSTEM`, `TOOL`).
  2. `chat/controller.js` was inserting `role: 'user'` and `role: 'assistant'` (lowercase strings).
  3. Prisma threw an unhandled enum validation error on `prisma.message.create()` and silently failed inside a `try/catch` block.
  4. As a result, **zero messages were ever persisted to PostgreSQL**.
  5. On subsequent turns, `pastMessages` returned `[]` (empty history). The AI received the new prompt with no context of the conversation.
  6. Furthermore, Gemini's `startChat({ history })` requires `history[0].role === 'user'`.
- **Decision:**
  1. Updated all `prisma.message.create()` calls to use uppercase enum values `role: 'USER'` and `role: 'ASSISTANT'`.
  2. Normalized history retrieval to map `(m.role || '').toLowerCase() === 'assistant' ? 'assistant' : 'user'`.
  3. Added role sanitization in `gemini.js` to ensure the first history turn is always `'user'`.
  4. Made `MessageBubble.jsx` check `(message.role || '').toLowerCase() === 'user'` so UI bubble styles render consistently.
- **Reasoning:**
  Preserves database consistency and enables seamless multi-turn conversations where follow-ups like *"explain in short"*, *"why?"*, or *"summarize this"* maintain full context of previous turns.

---

## 4. Guidelines for Future Decision Logging

Whenever an architectural or impactful code change is made:
1. **Document the Context & Problem:** What failed, broke, or prompted the need for a change?
2. **Document the Decision:** What code/file was modified?
3. **Explain "Why this approach?":** What technical advantage does this approach have over alternative patterns?
4. **Log Library Additions/Removals:** If a new npm package is installed, document why it was chosen over native capabilities or alternatives.
