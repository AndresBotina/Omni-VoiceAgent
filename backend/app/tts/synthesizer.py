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
