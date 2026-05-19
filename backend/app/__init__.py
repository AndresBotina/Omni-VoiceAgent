import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router
from .rag.ingestion import ingest_url


@asynccontextmanager
async def lifespan(app: FastAPI):
    rag_url = os.getenv("RAG_SOURCE_URL", "").strip()
    if rag_url:
        try:
            count = await ingest_url(rag_url)
            print(f"Startup ingestion complete: {count} chunks from {rag_url}")
        except Exception as e:
            print(f"Startup ingestion failed (continuing): {e}")
    yield
    print("VoiceAgent shutting down")


app = FastAPI(title="VoiceAgent API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
