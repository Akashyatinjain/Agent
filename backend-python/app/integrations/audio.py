import io
from typing import Optional
from app.core.config import settings
from app.core.logging import logger

async def transcribe_voice_note(
    audio_bytes: bytes,
    mime_type: str = "audio/ogg",
    filename: str = "voice_note.ogg"
) -> Optional[str]:
    """
    Transcribe incoming voice audio bytes into text.
    Primary: Google Gemini Flash Audio (zero-dependency, multimodal).
    Fallback: OpenAI Whisper API.
    """
    if not audio_bytes:
        return None

    # 1. Attempt Gemini Flash Audio transcription
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")

            audio_part = {
                "mime_type": mime_type,
                "data": audio_bytes
            }
            prompt = (
                "Please transcribe this voice message accurately into text. "
                "Keep the original language (English, Hindi, Hinglish, or multilingual). "
                "Do not add any explanations, introductory text, or quotation marks. "
                "Return only the exact transcribed words."
            )

            # Generate content synchronously wrapped in async executor if needed
            import asyncio
            response = await asyncio.to_thread(
                model.generate_content,
                [audio_part, prompt]
            )

            if response and response.text:
                transcription = response.text.strip()
                logger.info(f"Gemini Audio successfully transcribed voice note ({len(transcription)} chars)")
                return transcription
        except Exception as gemini_err:
            logger.warning(f"Gemini voice transcription failed: {gemini_err}. Trying OpenAI Whisper fallback...")

    # 2. Fallback: OpenAI Whisper API
    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = filename

            transcription_resp = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )

            if transcription_resp and transcription_resp.text:
                transcription = transcription_resp.text.strip()
                logger.info(f"Whisper successfully transcribed voice note ({len(transcription)} chars)")
                return transcription
        except Exception as whisper_err:
            logger.error(f"Whisper voice transcription also failed: {whisper_err}")

    logger.error("No available speech-to-text provider succeeded.")
    return None
