# 🤖 Personal AI Advisor

> A full-stack multi-agent AI application that provides domain-specific advisory through intelligent RAG-powered conversations.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-API-F55036?style=flat-square&logo=lightning&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant-VectorDB-DC244C?style=flat-square&logo=databricks&logoColor=white)

---

## 📖 Short Description

**Personal AI Advisor** is a full-stack, multi-agent AI application that empowers users to get expert-level advice across four specialized domains — **Medical**, **Education**, **Finance**, and **Legal** — by chatting with purpose-built AI agents enriched with their own uploaded documents.

Users register, upload domain-relevant PDFs or text files, and converse with a specialized AI advisor in that domain. Each agent leverages **Retrieval-Augmented Generation (RAG)** to ground its responses in the user's uploaded documents, delivering accurate, context-aware answers rather than generic AI output.

---

## ✨ Features

- 🔐 **User Authentication** — Secure registration and login with persistent user accounts
- 🗂️ **Domain-Based Chat Sessions** — Isolated chat environments per advisory domain
- 🤖 **4 Specialized AI Agents** — Distinct personas and system prompts per domain
- 📄 **Document Upload** — Upload PDF and TXT files per domain; documents are indexed and retrievable
- 📎 **File Access in Chat** — Uploaded files appear inside the relevant domain chat page and are clickable to open
- 🔍 **RAG Pipeline** — Responses are grounded in uploaded document context via vector similarity search
- 💬 **Session & Chat History** — Persistent chat sessions with conversation history management
- 🖋️ **Markdown Rendering** — AI responses are rendered with clean markdown-style formatting

---

## 🖥️ Demo / Screens Overview

| Screen | Description |
|--------|-------------|
| **Login / Register** | Clean authentication screens for user onboarding |
| **Domain Dashboard** | Four domain cards — Medical, Education, Finance, Legal |
| **Domain Chat Page** | Chat interface with the specialized agent + sidebar of uploaded files |
| **Document Upload** | Upload PDFs or TXT files that are indexed into the vector store |
| **AI Response View** | Markdown-rendered AI responses grounded in your uploaded documents |

> 📸 _Screenshots or a live demo link can be added here once deployed._

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React + Vite | UI framework and fast build tooling |
| React Router | Client-side routing and navigation |
| Zustand | Lightweight global state management |
| Axios | HTTP client for API communication |
| Tailwind CSS | Utility-first styling |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | User, session, and document metadata storage |
| Multer | Multipart file upload handling |

### AI & RAG
| Technology | Purpose |
|------------|---------|
| Groq API | LLM inference for agent responses |
| Vector Embeddings | Document chunk embeddings for semantic search |
| Qdrant | Vector database for similarity-based retrieval |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│         Auth  │  Domain UI  │  Chat  │  File Viewer         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼──────────────────────────────────┐
│                    SERVER (Express API)                       │
│     Auth Routes │ Chat Routes │ Upload Routes │ Session      │
└────┬──────────────────────────────────────────┬─────────────┘
     │                                          │
     │ MongoDB                          RAG orchestration
     │ (Users, Sessions, File Metadata)         │
┌────▼──────────┐                  ┌────────────▼────────────┐
│   MongoDB     │                  │      ai-services/        │
│  (Mongoose)   │                  │  Agent Logic │ RAG       │
└───────────────┘                  │  Embeddings  │ Prompts   │
                                   └──────────────┬──────────┘
                                                  │
                                   ┌──────────────▼──────────┐
                                   │     vector-db/           │
                                   │   Qdrant Integration     │
                                   └─────────────────────────┘
```

- The **client** communicates exclusively with the Express **server** via REST.
- The **server** handles auth, file uploads, and chat routing, delegating AI logic to **ai-services**.
- **ai-services** manages agent orchestration, embeddings, and Qdrant queries.
- **vector-db** provides the integration layer to the Qdrant vector database.
- **shared** modules supply common configuration and utilities across layers.

---

## 📁 Folder Structure

```
Project file structure (exact, excluding node_modules and uploaded runtime files):

personal-ai-advisor/
├── ai-services/
│   ├── agents/
│   │   ├── .gitkeep
│   │   ├── doctorAgent.js
│   │   ├── financeAgent.js
│   │   ├── lawyerAgent.js
│   │   └── teacherAgent.js
│   ├── embeddings/
│   │   ├── .gitkeep
│   │   └── embedder.js
│   ├── orchestrator/
│   │   ├── .gitkeep
│   │   └── agentRouter.js
│   ├── rag/
│   │   ├── .gitkeep
│   │   ├── indexer.js
│   │   └── retriever.js
│   ├── .env
│   ├── .env.example
│   └── groqClient.js
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   ├── .gitkeep
│   │   │   ├── axios.js
│   │   │   └── services.js
│   │   ├── components/
│   │   │   ├── .gitkeep
│   │   │   └── MarkdownRenderer.jsx
│   │   ├── hooks/
│   │   │   └── .gitkeep
│   │   ├── pages/
│   │   │   ├── .gitkeep
│   │   │   ├── ChatPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── UploadPage.jsx
│   │   ├── store/
│   │   │   ├── .gitkeep
│   │   │   └── authStore.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── markdown-renderer.css
│   ├── .env
│   ├── .env.example
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── config/
│   │   ├── .gitkeep
│   │   └── db.js
│   ├── controllers/
│   │   ├── .gitkeep
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   └── documentController.js
│   ├── middleware/
│   │   ├── .gitkeep
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── .gitkeep
│   │   ├── ChatMessage.js
│   │   ├── ChatSession.js
│   │   ├── Document.js
│   │   └── User.js
│   ├── routes/
│   │   ├── .gitkeep
│   │   ├── auth.js
│   │   ├── chat.js
│   │   └── documents.js
│   ├── services/
│   │   └── .gitkeep
│   ├── uploads/
│   │   └── .gitkeep
│   ├── .env
│   ├── .env.example
│   ├── index.js
│   ├── package-lock.json
│   └── package.json
├── shared/
│   ├── .env
│   └── runtime.js
├── vector-db/
│   ├── .env
│   ├── .env.example
│   └── qdrantClient.js
├── .gitignore
└── README.md

```

---

## ⚙️ How It Works

### Authentication Flow
1. User registers or logs in via the React frontend.
2. The server validates credentials, creates/verifies a user record in MongoDB, and returns an auth token.
3. The token is stored client-side (via Zustand) and attached to subsequent API requests.

### Domain Chat Flow
1. User selects a domain (Medical, Education, Finance, or Legal) from the dashboard.
2. A chat session is created or resumed for that user + domain pair.
3. The user's message is sent to the server, which routes it to the correct AI agent via `ai-services/orchestrator`.
4. The agent retrieves relevant context from Qdrant (user's uploaded documents for that domain).
5. A prompt is constructed from the agent's persona, retrieved context, and conversation history.
6. Groq API generates a response, which is returned and rendered in markdown format.

### Document Upload Flow
1. User uploads a PDF or TXT file within a domain chat page.
2. The server receives the file via Multer and stores its metadata in MongoDB.
3. `ai-services` parses and chunks the document, generates vector embeddings per chunk, and upserts them into the matching Qdrant collection.
4. The uploaded file immediately appears in the chat page sidebar and is clickable to open.

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local instance or MongoDB Atlas)
- **Qdrant** (local Docker instance or Qdrant Cloud)
- **Groq API Key** — [Get one free at console.groq.com](https://console.groq.com)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/personal-ai-advisor.git
cd personal-ai-advisor
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Install ai-services dependencies (if separate package.json)
cd ../ai-services && npm install
```

### 3. Configure Environment Variables

Copy the example env files and fill in your values:

```bash
cp .env.example server/.env
cp .env.example client/.env
```

---

## 🔑 Environment Variables

### `server/.env`

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/personal-ai-advisor

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Groq AI
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-70b-8192

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key_if_cloud

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

### `client/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## ▶️ Running Locally

### Start Qdrant (via Docker)

```bash
docker pull qdrant/qdrant
docker run -p 6333:6333 qdrant/qdrant
```

### Start the Backend

```bash
cd server
npm run dev
# Server running at http://localhost:5000
```

### Start the Frontend

```bash
cd client
npm run dev
# Frontend running at http://localhost:5173
```

> Make sure MongoDB is running locally or your `MONGO_URI` points to a reachable Atlas cluster.

---

## 📡 API Overview

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |

**Example — Register:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}
```

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/:domain` | Send a message to a domain agent |
| `GET` | `/api/chat/:domain/history` | Retrieve chat history for a domain session |

**Example — Send Message:**
```http
POST /api/chat/medical
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What does high creatinine in a blood test indicate?",
  "sessionId": "abc123"
}
```

### Document Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload/:domain` | Upload a PDF or TXT file to a domain |
| `GET` | `/api/upload/:domain/files` | List uploaded files for a domain |

**Example — Upload File:**
```http
POST /api/upload/legal
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [contract.pdf]
```

---

## 🤖 AI Agents

Each agent is a specialized instance with a unique system prompt, persona, and domain focus:

| Agent | Domain | Persona | Focus Areas |
|-------|--------|---------|-------------|
| 🩺 **Doctor** | Medical | Knowledgeable, empathetic medical advisor | Symptoms, conditions, lab results, general health |
| 🎓 **Teacher** | Education | Patient, encouraging educational tutor | Concepts, learning strategies, academic subjects |
| 💰 **Finance Advisor** | Finance | Analytical, prudent financial guide | Budgeting, investments, financial planning |
| ⚖️ **Lawyer** | Legal | Precise, professional legal advisor | Contracts, rights, legal procedures (general guidance) |

> **Disclaimer:** Agents provide informational guidance only and are not substitutes for licensed professional advice.

All agents share the same underlying Groq LLM but differ in system prompt construction, persona tone, and the Qdrant collection queried for context retrieval.

---

## 📄 Document Upload and Retrieval Flow

```
User Uploads File (PDF / TXT)
         │
         ▼
   Multer receives file
   → stored temporarily on server
         │
         ▼
   File metadata saved to MongoDB
   (filename, domain, userId, uploadedAt)
         │
         ▼
   ai-services parses & chunks document
   (split into overlapping text chunks)
         │
         ▼
   Each chunk → embedding model
   → generates a vector representation
         │
         ▼
   Vectors upserted into Qdrant
   (collection per domain, tagged with userId)
         │
         ▼
   File appears in domain chat sidebar ✓

─────────────────────────────────────────

User sends a message in a domain chat
         │
         ▼
   Message → embedding generated
         │
         ▼
   Qdrant similarity search
   (top-k relevant chunks for this user + domain)
         │
         ▼
   Retrieved chunks injected into prompt
   as grounding context
         │
         ▼
   Agent system prompt + context + history + message
   → Groq API call
         │
         ▼
   Response rendered in markdown ✓
```

This RAG pipeline ensures that every AI response is grounded in the user's actual uploaded documents — not just generic training data.

---

## 💡 Why This Project?

Most AI chat applications give you a generic assistant. **Personal AI Advisor** takes a different approach — it lets users bring their own knowledge base (their contracts, medical reports, study materials, financial documents) and have meaningful conversations with domain-specialized agents that actually understand *their* context.

This project demonstrates:
- Multi-agent orchestration with domain-specific personas
- A production-style RAG pipeline (ingest → embed → retrieve → generate)
- Full-stack authentication and session management
- Clean separation of concerns across client, server, AI services, and vector database

---

## 🌟 Key Highlights

- 🔒 **Secure by design** — JWT-protected routes, user-scoped document retrieval
- 🧠 **Context-aware AI** — Every response is grounded in the user's own uploaded documents
- 📂 **Domain isolation** — Each domain has its own Qdrant collection and chat session
- 🧩 **Modular architecture** — `ai-services` and `vector-db` are cleanly decoupled from the Express server
- ⚡ **Fast inference** — Powered by Groq's ultra-low-latency LLM API
- 🖋️ **Readable responses** — Markdown-rendered AI output for clear, structured answers

---

## 🔮 Future Improvements

- [ ] Add support for more file types (DOCX, images with OCR)
- [ ] Implement streaming responses for real-time token-by-token output
- [ ] Add a user dashboard with document management (rename, delete)
- [ ] Support multi-turn context summarization for very long sessions
- [ ] Add agent response citations linking back to source document chunks
- [ ] Role-based access with admin panel for managing users and documents
- [ ] Deploy as containerized microservices with Docker Compose
- [ ] Add rate limiting and usage analytics per user

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add: your feature description'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow the existing code style and include clear commit messages.

---

## 📝 License

This project is licensed under the **MIT License**.  
See the [LICENSE](./LICENSE) file for full details.

---

<div align="center">
  <p>Built with ❤️ using React, Node.js, Groq, and Qdrant</p>
  <p>
    <a href="#-personal-ai-advisor">Back to top ↑</a>
  </p>
</div>
