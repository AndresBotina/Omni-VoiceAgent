import os
from openai import AsyncOpenAI


# Sends text to the OpenAI TTS API and returns raw MP3 bytes
async def synthesize_speech(text: str) -> bytes:
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    # Model and voice are configurable via environment variables
    model = os.getenv("TTS_MODEL", "tts-1")
    voice = os.getenv("TTS_VOICE", "alloy")

    response = await client.audio.speech.create(
        model=model,
        voice=voice,
        input=text,
    )
    return response.content


async def synthesize_speech_elevenlabs(text: str) -> bytes:
    import httpx
    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json"
    }
    body = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=body, timeout=30)
        response.raise_for_status()
        return response.content
