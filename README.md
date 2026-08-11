# MiniGPT — AI-Powered Personal Assistant

![MiniGPT Architecture](https://img.shields.io/badge/Architecture-AI%20Router-purple?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20Neon%20%7C%20S3-blue?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-Neon%20PostgreSQL%20%2B%20pgvector-emerald?style=for-the-badge)
![LLM Providers](https://img.shields.io/badge/LLM-Gemini%20%2B%20OpenAI-pink?style=for-the-badge)

A production-grade, full-stack AI Personal Assistant built to solve daily life problems through an **Intelligent Intent Router Architecture**.

---

## 🧠 System Architecture

```
                       USER MESSAGE
                            │
                            ▼
                        AI ROUTER
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
      CHAT                 RAG                 TOOL
        │                   │                   │
        ▼                   ▼                   ▼
    LLM ENGINE        pgvector SEARCH        API TOOLS
  (Gemini/OpenAI)     (S3 Documents)      (Weather/Search/Math)
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    SYNTHESIZED RESPONSE
```

### Key Highlights for Recruiters
1. **Intelligent Router Architecture:** Dynamically classifies incoming user intent via LLMs and dispatches to appropriate handling pipelines (Direct Chat, RAG Vector Retrieval, Tool Execution, or Hybrid).
2. **Neon PostgreSQL + pgvector:** Single unified database for relational user data AND vector embeddings.
3. **AWS S3 Integration:** Production file storage pipeline for document ingestion.
4. **Multi-Provider LLM Abstraction:** Seamless switching between Google Gemini and OpenAI GPT-4o mid-conversation.
5. **Real-time SSE Streaming:** Low-latency Server-Sent Events typewriter streaming.
6. **Automatic Memory Extraction:** Extracts and persists personal facts across conversations.

---

## 📁 Monorepo Folder Structure

```
c:\AkashAgent/
├── apps/
│   ├── web/                     # React 18 + Vite Frontend Application
│   │   ├── src/
│   │   │   ├── components/      # Glassmorphism UI Components (Modal, Button, Input, Sidebar)
│   │   │   ├── features/        # Feature Modules (Chat, Auth, Files, Knowledge, Settings)
│   │   │   ├── pages/           # Application Router Pages
│   │   │   ├── store/           # Zustand State Management
│   │   │   └── api/             # Axios & SSE API Clients
│   │   └── package.json
│   │
│   └── api/                     # Node.js + Express API Backend
│       ├── src/
│       │   ├── ai/              # AI Router, LLM Multi-provider & Prompts
│       │   ├── rag/             # Document Chunking, Embeddings & Vector Search
│       │   ├── memory/          # Automatic Memory Extraction & Storage
│       │   ├── tools/           # Web Search, Weather, and Math Calculator
│       │   ├── auth/            # JWT Authentication System
│       │   ├── chat/            # Chat Controller & SSE Engine
│       │   └── files/           # AWS S3 Storage & Processing Pipeline
│       └── prisma/
│           └── schema.prisma    # Neon Postgres Schema with pgvector
│
├── packages/
│   ├── shared-types/            # Common Types & Constants
│   └── config/                  # Shared Configuration
│
├── package.json                 # npm Workspaces Monorepo Config
├── .env.example                 # Environment Template
└── README.md
```

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install all monorepo dependencies:
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```env
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/minigpt?sslmode=require
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

### 3. Database Migration
Push Prisma schema to your Neon database:
```bash
npm run db:push
```

### 4. Running Development Servers
Start both backend API and frontend React web app concurrently:
```bash
npm run dev
```

- **Frontend Web App:** `http://localhost:5173`
- **Backend API Server:** `http://localhost:5000`

---

## 🛠️ Built With

- **Frontend:** React 18, Vite, Zustand, Tailwind / Vanilla Glassmorphism CSS, React Markdown, Lucide Icons
- **Backend:** Node.js, Express, Prisma ORM, JWT, Bcrypt
- **Cloud & AI:** Neon PostgreSQL, pgvector, AWS S3, Google Gemini API, OpenAI API
