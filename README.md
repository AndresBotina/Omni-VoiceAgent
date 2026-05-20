# Omni — Urban Intelligence Assistant

An AI-powered urban assistant that helps travelers and foreigners explore any city in the world. Provides real-time weather, currency conversion, web search, and a private knowledge base to deliver practical, context-aware city guidance.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Vite |
| Backend | Python 3.11 + FastAPI |
| AI Agent | LangChain + GPT-4o |
| Embeddings | OpenAI text-embedding-3-small |
| Vector Store | PostgreSQL + pgvector (local Docker) |
| Text-to-Speech | OpenAI TTS (tts-1) |
| Web Search | Tavily Search API |
| Containerization | Docker + Docker Compose |

---

## Agent Tools

| Tool | Trigger | Description |
|------|---------|-------------|
| `get_weather` | Questions about climate or temperature | Fetches real-time weather via OpenWeatherMap API with practical recommendations. |
| `convert_currency` | Questions about money, prices or exchange rates | Converts between any currencies using live rates. Defaults to COP if target currency not specified. |
| `web_search` | Questions about places, transport, food | Searches the web for real-time city information |
| `search_knowledge_base` | Domain-specific city questions | Searches ingested content from configured RAG source |

---

## Voice Modes

| Mode | Description |
|------|-------------|
| Standard | OpenAI TTS (tts-1) — fast and reliable |
| Premium  | ElevenLabs multilingual v2 — high quality natural voice |

---

## Setup

### Prerequisites
- Docker and Docker Compose installed ([Install Docker](https://docs.docker.com/get-docker/))
- Git installed
- OpenAI API key ([platform.openai.com](https://platform.openai.com))
- Tavily API key ([tavily.com](https://tavily.com) — free tier)
- OpenWeatherMap API key ([openweathermap.org](https://openweathermap.org/api) — free tier)

### Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd VoiceAgent
```

### Step 2 — Create your environment file

```bash
cp .env.example .env
```

### Step 3 — Fill in your API keys

Open `.env` and fill in the following values:

```env
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/voiceagent
RAG_SOURCE_URL=https://en.wikipedia.org/wiki/Medell%C3%ADn
TTS_MODEL=tts-1
TTS_VOICE=alloy
OPENWEATHER_API_KEY=your_openweathermap_key
VITE_OPENWEATHER_API_KEY=your_openweathermap_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id
```

> **Note:** `OPENWEATHER_API_KEY` and `VITE_OPENWEATHER_API_KEY` must have the same value.  
> **Note:** `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are required only for Premium voice mode.  
> **Note:** `DATABASE_URL` does not need to be changed — it works as-is with Docker.

### Step 4 — Build and start all services

```bash
docker compose up --build
```

Wait for all three services to be ready:
- `postgres` — "database system is ready to accept connections"
- `backend` — "Application startup complete"
- `frontend` — "VITE ready"

### Step 5 — Open the app

```
http://localhost:5174
```

### Step 6 — Optional: Ingest a knowledge base URL

Click **Sources** in the left sidebar, paste any URL and click **Ingest**.  
The agent will use that content to answer domain-specific questions.

### Stopping the app

```bash
docker compose down
```

### Rebuilding after code changes

```bash
docker compose up --build --pull never
```

---

## RAG Knowledge Base

The agent automatically ingests the URL set in `RAG_SOURCE_URL` on startup. To ingest a different URL at runtime, use the **Knowledge Base** panel at the bottom of the UI.

**Default RAG source:** `https://en.wikipedia.org/wiki/Medell%C3%ADn`

To change it: update `RAG_SOURCE_URL` in your `.env` file and restart.

---

## Project Structure

```
VoiceAgent/
├── docker-compose.yml        # Defines frontend, backend, postgres services
├── .env.example              # Environment variable template
├── README.md                 # This file
├── frontend/
│   ├── Dockerfile            # Node 20 Alpine, Vite dev server
│   ├── package.json          # React 18, Vite 6 dependencies
│   ├── vite.config.js        # Proxy /api to backend, host 0.0.0.0
│   └── src/
│       ├── main.jsx          # React 18 root render
│       ├── App.jsx           # Main layout, state, message handling
│       ├── index.css         # Global reset and keyframe animations
│       ├── components/
│       │   ├── ChatWindow.jsx    # Scrollable message list with typing indicator
│       │   ├── MessageBubble.jsx # Individual message with tool badge and audio
│       │   ├── ToolIndicator.jsx # Amber pill badge showing tool name
│       │   └── AudioPlayer.jsx   # Base64 audio decoder and player
│       └── services/
│           └── api.js            # sendMessage, ingestUrl, generateSessionId
└── backend/
    ├── Dockerfile            # Python 3.11 slim, uvicorn with reload
    ├── requirements.txt      # All Python dependencies
    ├── main.py               # Uvicorn entry point
    └── app/
        ├── __init__.py       # FastAPI app, CORS, lifespan, RAG startup
        ├── agent/
        │   ├── agent.py      # Session store, ToolCaptureCallback, run_agent
        │   └── tools.py      # web_search, get_weather, convert_currency, search_knowledge_base
        ├── rag/
        │   ├── ingestion.py  # Fetch, chunk, embed, upsert to pgvector
        │   └── retriever.py  # Embed query, similarity search, return chunks
        ├── tts/
        │   └── synthesizer.py # OpenAI TTS, returns MP3 bytes
        └── api/
            └── routes.py     # /health, /chat, /ingest endpoints
```

---

## API Reference

**POST /api/chat**

```json
// Request
{ "session_id": "string", "message": "string", "mode": "text" | "voice" }

// Response
{ "response": "string", "tool_used": "string | null", "audio": "base64string | null" }
```

**POST /api/ingest**

```json
// Request
{ "url": "string" }

// Response
{ "status": "success", "chunks_ingested": 42 }
```

**GET /api/health**

```json
{ "status": "ok" }
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4o, embeddings, and TTS |
| `TAVILY_API_KEY` | Yes | Tavily API key for web search |
| `DATABASE_URL` | Yes | PostgreSQL connection string (pre-filled for Docker) |
| `RAG_SOURCE_URL` | No | URL to ingest on startup for the knowledge base |
| `TTS_MODEL` | No | OpenAI TTS model (default: `tts-1`) |
| `TTS_VOICE` | No | TTS voice (default: `alloy`) |
| `OPENWEATHER_API_KEY` | Yes | OpenWeatherMap API key (free at openweathermap.org) |
| `VITE_OPENWEATHER_API_KEY` | Yes | OpenWeatherMap API key for frontend (same value as OPENWEATHER_API_KEY) |
| `ELEVENLABS_API_KEY` | For Premium voice | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | For Premium voice | ElevenLabs Voice ID |

---

## Security

- No API keys are hardcoded anywhere in the source code.
- All secrets are loaded from environment variables via `.env`.
- `.env` is excluded from the repository via `.gitignore`.
