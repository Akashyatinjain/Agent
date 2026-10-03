import httpx
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.service import ChannelService
from app.integrations.audio import transcribe_voice_note
from app.ai.router.executor import route_and_execute
from app.core.logging import logger

async def handle_whatsapp_message(
    sender_id: str,
    body: str,
    media_url: Optional[str] = None,
    media_type: Optional[str] = None,
    sender_name: Optional[str] = None,
    db: Optional[AsyncSession] = None
) -> str:
    """
    Handle WhatsApp message and return text response.
    Supports linking commands (/link 123456), audio voice notes, and unified AI chats.
    """
    if not db:
        return "Service temporarily unavailable. Please try again shortly."

    clean_phone = sender_id.replace("whatsapp:", "").strip()
    text = (body or "").strip()

    # 1. Handle Linking Command: "link 123456" or "/link 123456"
    if text.lower().startswith("link") or text.lower().startswith("/link"):
        parts = text.split(maxsplit=1)
        if len(parts) > 1 and parts[1].strip().isdigit() and len(parts[1].strip()) == 6:
            code = parts[1].strip()
            user = await ChannelService.verify_and_link(
                db=db,
                channel_type="WHATSAPP",
                channel_user_id=clean_phone,
                code=code,
                channel_username=sender_name or clean_phone
            )
            if user:
                return (
                    f"🎉 *Account Connected!*\n\n"
                    f"Welcome, *{user.name}*! Your WhatsApp is now linked to *{user.email}*.\n\n"
                    f"✨ *Unified Features:*\n"
                    f"• 📄 Ask questions about any PDF or resume uploaded on the Web app\n"
                    f"• 🧠 Shared memory bank across Web and WhatsApp\n"
                    f"• 🎙️ Send voice notes on-the-go\n"
                    f"• 🔍 Live web search, tools, and calculators"
                )
            else:
                return "❌ *Invalid Code:* The code has expired or is invalid. Please generate a fresh code on the Web App."
        else:
            return "ℹ️ *Usage:* Send `link <6-digit-code>` generated from Settings -> Connected Channels in your Web App."

    # 2. Handle Unlink
    if text.lower() in ("unlink", "/unlink"):
        linked_user = await ChannelService.get_user_for_channel(db, "WHATSAPP", clean_phone)
        if linked_user:
            await ChannelService.disconnect_channel(db, linked_user.id, "WHATSAPP")
            return "🔌 *Disconnected:* Your WhatsApp has been unlinked from AkashAgent."
        return "ℹ️ This WhatsApp number is not linked to any account."

    # 3. Handle Voice Note
    if media_url and media_type and media_type.startswith("audio"):
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.get(media_url)
                if res.status_code == 200:
                    audio_bytes = res.content
                    transcription = await transcribe_voice_note(
                        audio_bytes=audio_bytes,
                        mime_type=media_type
                    )
                    if transcription:
                        linked_user = await ChannelService.get_user_for_channel(db, "WHATSAPP", clean_phone)
                        user_id = linked_user.id if linked_user else f"whatsapp_guest_{clean_phone}"

                        result = await route_and_execute(
                            user_message=transcription,
                            user_id=user_id,
                            db=db,
                            provider="gemini"
                        )
                        reply = f"🎙️ *Heard:* _\"{transcription}\"_\n\n{result.get('response', '')}"
                        if not linked_user:
                            reply += "\n\n---\n💡 _Tip: Link your Web account with `link <CODE>` to search your documents!_"
                        return reply
                    else:
                        return "🎙️ Could not clearly transcribe that voice note. Please try speaking closer or send as text."
        except Exception as e:
            logger.error(f"WhatsApp voice processing error: {e}", exc_info=True)
            return "⚠️ Failed to process audio. Please send as text."

    # 4. Handle Standard Text Message
    linked_user = await ChannelService.get_user_for_channel(db, "WHATSAPP", clean_phone)
    user_id = linked_user.id if linked_user else f"whatsapp_guest_{clean_phone}"

    try:
        result = await route_and_execute(
            user_message=text or "Hello",
            user_id=user_id,
            db=db,
            provider="gemini"
        )
        response_body = result.get("response", "No response generated.")

        if not linked_user:
            response_body += "\n\n---\n💡 _Tip: Link your Web account by sending `link <6-DIGIT-CODE>` from your Web App settings!_"

        return response_body
    except Exception as e:
        logger.error(f"Error handling WhatsApp message: {e}", exc_info=True)
        return "⚠️ An error occurred while processing your request. Please try again shortly."
