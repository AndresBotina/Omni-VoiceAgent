import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..agent.agent import run_agent
from ..tts.synthesizer import synthesize_speech
from ..rag.ingestion import ingest_url

router = APIRouter()


class ChatRequest(BaseModel):
    session_id: str
    message: str
    mode: str  # "text" or "voice"


class ChatResponse(BaseModel):
    response: str
    tool_used: str | None
    audio: str | None  # base64-encoded MP3, only when mode == "voice"


class IngestRequest(BaseModel):
    url: str


# Liveness check — returns 200 immediately, used by Docker and monitoring
@router.get("/health")
async def health():
    return {"status": "ok"}


# Main chat endpoint — runs the agent and optionally synthesizes a voice response
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        result = await run_agent(request.session_id, request.message)

        # In voice mode, convert the text response to MP3 and base64-encode it
        if request.mode == "voice":
            audio_bytes = await synthesize_speech(result["response"])
            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        else:
            audio_b64 = None

        return ChatResponse(
            response=result["response"],
            tool_used=result["tool_used"],
            audio=audio_b64,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Ingest endpoint — fetches, chunks, embeds, and stores content from a URL
@router.post("/ingest")
async def ingest(request: IngestRequest):
    try:
        count = await ingest_url(request.url)
        return {"status": "success", "chunks_ingested": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
