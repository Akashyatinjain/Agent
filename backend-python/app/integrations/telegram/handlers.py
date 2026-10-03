from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.telegram.bot import telegram_bot
from app.integrations.service import ChannelService
from app.integrations.audio import transcribe_voice_note
from app.ai.router.executor import route_and_execute
from app.core.logging import logger

async def handle_telegram_update(update: Dict[str, Any], db: AsyncSession):
    """Process an incoming update object from Telegram webhook or poller."""
    message = update.get("message")
    if not message:
        return

    chat = message.get("chat", {})
    chat_id = chat.get("id")
    if not chat_id:
        return

    sender = message.get("from", {})
    user_first_name = sender.get("first_name", "Friend")
    sender_username = sender.get("username")

    text = message.get("text", "").strip()
    voice = message.get("voice")

    # 1. Handle /start command (including deep link /start 123456)
    if text.startswith("/start"):
        parts = text.split(maxsplit=1)
        if len(parts) > 1 and parts[1].strip().isdigit() and len(parts[1].strip()) == 6:
            code = parts[1].strip()
            user = await ChannelService.verify_and_link(
                db=db,
                channel_type="TELEGRAM",
                channel_user_id=str(chat_id),
                code=code,
                channel_username=sender_username
            )
            if user:
                await telegram_bot.send_message(
                    chat_id=chat_id,
                    text=(
                        f"🎉 *Account Linked Successfully!*\n\n"
                        f"Welcome, *{user.name}*! Your Telegram account is now securely synced with *{user.email}*.\n\n"
                        f"✨ *Unified Capabilities:*\n"
                        f"• 📄 *Uploaded Documents:* Ask questions about any PDF, resume, or document uploaded on the Web app.\n"
                        f"• 🧠 *Shared Memory:* Any fact remembered on Web or Telegram is instantly synchronized.\n"
                        f"• 🎙️ *Voice Notes:* Send audio notes on-the-go while walking or driving!\n"
                        f"• 🔍 *Live Tools:* Ask for real-time weather, calculations, or web research."
                    )
                )
                return
            else:
                await telegram_bot.send_message(
                    chat_id=chat_id,
                    text=(
                        "❌ *Invalid or Expired Code*\n\n"
                        "The 6-digit code has expired or does not exist. Please generate a new code on the Web App in "
                        "*Settings $\\rightarrow$ Connected Channels* and click the link or send `/link <code>`."
                    )
                )
                return

        # Regular /start
        linked_user = await ChannelService.get_user_for_channel(db, "TELEGRAM", str(chat_id))
        if linked_user:
            await telegram_bot.send_message(
                chat_id=chat_id,
                text=(
                    f"👋 *Welcome back, {linked_user.name}!*\n\n"
                    f"I am ready. Ask me anything, inquire about your uploaded files, or send a voice note!"
                )
            )
        else:
            await telegram_bot.send_message(
                chat_id=chat_id,
                text=(
                    f"👋 *Hello, {user_first_name}! Welcome to AkashAgent AI.*\n\n"
                    f"I am your personal AI assistant. You can chat with me freely, or link this chat to your "
                    f"Web account to unlock **Unified Memory** and **Document Retrieval (RAG)**.\n\n"
                    f"👉 Send `/link <6-DIGIT-CODE>` to link your account.\n"
                    f"_(Get your code from Settings $\\rightarrow$ Connected Channels on the Web App)_"
                )
            )
        return

    # 2. Handle /link <code> command
    if text.startswith("/link"):
        parts = text.split(maxsplit=1)
        if len(parts) > 1:
            code = parts[1].strip()
            user = await ChannelService.verify_and_link(
                db=db,
                channel_type="TELEGRAM",
                channel_user_id=str(chat_id),
                code=code,
                channel_username=sender_username
            )
            if user:
                await telegram_bot.send_message(
                    chat_id=chat_id,
                    text=(
                        f"🎉 *Account Connected!*\n\n"
                        f"Synced to *{user.name}* ({user.email}). All your Web documents and memory bank are now active in this chat!"
                    )
                )
            else:
                await telegram_bot.send_message(
                    chat_id=chat_id,
                    text="❌ *Link Failed:* The code is either invalid or expired. Please generate a fresh code on the Web app."
                )
        else:
            await telegram_bot.send_message(
                chat_id=chat_id,
                text="ℹ️ *Usage:* Send `/link <6-DIGIT-CODE>` generated in your Web App settings."
            )
        return

    # 3. Handle /unlink command
    if text.startswith("/unlink"):
        linked_user = await ChannelService.get_user_for_channel(db, "TELEGRAM", str(chat_id))
        if linked_user:
            await ChannelService.disconnect_channel(db, linked_user.id, "TELEGRAM")
            await telegram_bot.send_message(
                chat_id=chat_id,
                text="🔌 *Disconnected:* Your Telegram account has been unlinked from AkashAgent."
            )
        else:
            await telegram_bot.send_message(
                chat_id=chat_id,
                text="ℹ️ This chat is not linked to any AkashAgent account."
            )
        return

    # 4. Handle Voice Note
    if voice:
        await telegram_bot.send_chat_action(chat_id, "record_voice")
        file_id = voice.get("file_id")
        mime_type = voice.get("mime_type", "audio/ogg")

        audio_bytes = await telegram_bot.get_file_bytes(file_id)
        if not audio_bytes:
            await telegram_bot.send_message(chat_id, "⚠️ Failed to download voice note. Please try again.")
            return

        # Transcribe
        await telegram_bot.send_chat_action(chat_id, "typing")
        transcription = await transcribe_voice_note(audio_bytes, mime_type=mime_type)
        if not transcription:
            await telegram_bot.send_message(
                chat_id,
                "🎙️ *Could not transcribe audio.*\nPlease speak clearly or send your query as a text message."
            )
            return

        # Execute transcription through unified engine
        linked_user = await ChannelService.get_user_for_channel(db, "TELEGRAM", str(chat_id))
        user_id = linked_user.id if linked_user else f"telegram_guest_{chat_id}"

        result = await route_and_execute(
            user_message=transcription,
            user_id=user_id,
            db=db,
            provider="gemini"
        )

        response_body = result.get("response", "No response generated.")
        reply_text = f"🎙️ *Heard:* _\"{transcription}\"_\n\n{response_body}"

        if not linked_user:
            reply_text += "\n\n---\n💡 _Tip: Link your Web account using /link <CODE> to search your uploaded files!_"

        await telegram_bot.send_message(chat_id, reply_text)
        return

    # 5. Handle Text Message
    if text:
        await telegram_bot.send_chat_action(chat_id, "typing")
        linked_user = await ChannelService.get_user_for_channel(db, "TELEGRAM", str(chat_id))
        user_id = linked_user.id if linked_user else f"telegram_guest_{chat_id}"

        try:
            result = await route_and_execute(
                user_message=text,
                user_id=user_id,
                db=db,
                provider="gemini"
            )
            response_body = result.get("response", "No response generated.")

            if not linked_user:
                response_body += "\n\n---\n💡 _Tip: Link your Web account with /link <CODE> to enable document retrieval & memory!_"

            await telegram_bot.send_message(chat_id, response_body)
        except Exception as e:
            logger.error(f"Error handling Telegram message: {e}", exc_info=True)
            await telegram_bot.send_message(
                chat_id,
                "⚠️ An error occurred while processing your request. Please try again in a moment."
            )
