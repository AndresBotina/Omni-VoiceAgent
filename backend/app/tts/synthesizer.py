import os
from openai import AsyncOpenAI


async def synthesize_speech(text: str) -> bytes:
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    model = os.getenv("TTS_MODEL", "tts-1")
    voice = os.getenv("TTS_VOICE", "alloy")

    response = await client.audio.speech.create(
        model=model,
        voice=voice,
        input=text,
    )
    return response.content
