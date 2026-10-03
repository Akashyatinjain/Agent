import httpx
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging import logger

TELEGRAM_API_BASE = "https://api.telegram.org"

class TelegramBot:
    def __init__(self, token: Optional[str] = None):
        self.token = token or settings.TELEGRAM_BOT_TOKEN
        self.base_url = f"{TELEGRAM_API_BASE}/bot{self.token}" if self.token else ""

    @property
    def is_configured(self) -> bool:
        return bool(self.token and len(self.token) > 10)

    async def get_me(self) -> Optional[Dict[str, Any]]:
        """Verify bot token and get bot details."""
        if not self.is_configured:
            return None
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get(f"{self.base_url}/getMe")
                if res.status_code == 200:
                    data = res.json()
                    return data.get("result")
                logger.error(f"Telegram getMe failed: {res.text}")
            except Exception as e:
                logger.error(f"Telegram connection error: {e}")
        return None

    async def send_chat_action(self, chat_id: int | str, action: str = "typing") -> bool:
        """Send chat action such as 'typing' or 'record_voice'."""
        if not self.is_configured:
            return False
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                res = await client.post(
                    f"{self.base_url}/sendChatAction",
                    json={"chat_id": chat_id, "action": action}
                )
                return res.status_code == 200
            except Exception as e:
                logger.debug(f"Failed to send chat action: {e}")
                return False

    async def send_message(
        self,
        chat_id: int | str,
        text: str,
        parse_mode: Optional[str] = "Markdown",
        reply_to_message_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Send text message to Telegram user.
        Includes automatic fallback if Markdown formatting cannot be parsed by Telegram.
        """
        if not self.is_configured:
            logger.warning("TelegramBot token not configured; message skipped.")
            return None

        # Truncate text if exceeds Telegram 4096 character limit per message
        chunks = [text[i:i + 4000] for i in range(0, len(text), 4000)]
        last_result = None

        async with httpx.AsyncClient(timeout=15.0) as client:
            for idx, chunk in enumerate(chunks):
                payload = {
                    "chat_id": chat_id,
                    "text": chunk,
                    "disable_web_page_preview": True
                }
                if parse_mode:
                    payload["parse_mode"] = parse_mode
                if reply_to_message_id and idx == 0:
                    payload["reply_to_message_id"] = reply_to_message_id

                try:
                    res = await client.post(f"{self.base_url}/sendMessage", json=payload)
                    if res.status_code == 200:
                        last_result = res.json().get("result")
                    elif res.status_code == 400 and parse_mode:
                        # Retry without parse_mode if markdown parsing failed
                        logger.debug("Markdown parse failed on Telegram; retrying without markdown")
                        payload.pop("parse_mode", None)
                        retry_res = await client.post(f"{self.base_url}/sendMessage", json=payload)
                        if retry_res.status_code == 200:
                            last_result = retry_res.json().get("result")
                    else:
                        logger.error(f"Telegram sendMessage failed ({res.status_code}): {res.text}")
                except Exception as e:
                    logger.error(f"Failed to send telegram message to {chat_id}: {e}")

        return last_result

    async def get_file_bytes(self, file_id: str) -> Optional[bytes]:
        """Download raw file bytes (e.g. voice note audio) given a file_id."""
        if not self.is_configured:
            return None
        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                # 1. Get file path
                res = await client.get(f"{self.base_url}/getFile", params={"file_id": file_id})
                if res.status_code != 200:
                    logger.error(f"Telegram getFile failed: {res.text}")
                    return None
                file_info = res.json().get("result", {})
                file_path = file_info.get("file_path")
                if not file_path:
                    return None

                # 2. Download bytes from https://api.telegram.org/file/bot<token>/<file_path>
                dl_url = f"{TELEGRAM_API_BASE}/file/bot{self.token}/{file_path}"
                dl_res = await client.get(dl_url)
                if dl_res.status_code == 200:
                    return dl_res.content
                logger.error(f"Telegram download failed ({dl_res.status_code})")
            except Exception as e:
                logger.error(f"Error downloading file from Telegram: {e}")
        return None

    async def set_webhook(self, webhook_url: str) -> bool:
        """Set telegram webhook URL."""
        if not self.is_configured:
            return False
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.post(
                    f"{self.base_url}/setWebhook",
                    json={"url": webhook_url}
                )
                return res.status_code == 200 and res.json().get("ok", False)
            except Exception as e:
                logger.error(f"Failed to set webhook: {e}")
                return False

    async def delete_webhook(self) -> bool:
        """Delete current webhook to enable long-polling if needed."""
        if not self.is_configured:
            return False
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.post(f"{self.base_url}/deleteWebhook")
                return res.status_code == 200 and res.json().get("ok", False)
            except Exception as e:
                logger.error(f"Failed to delete webhook: {e}")
                return False

telegram_bot = TelegramBot()
