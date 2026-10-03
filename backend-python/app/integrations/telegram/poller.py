import asyncio
import httpx
from app.core.config import settings
from app.core.logging import logger
from app.db.database import AsyncSessionLocal
from app.integrations.telegram.bot import telegram_bot, TELEGRAM_API_BASE
from app.integrations.telegram.handlers import handle_telegram_update

async def run_telegram_poller():
    """
    Run Telegram long-polling loop for local development.
    Runs continuously without requiring a public HTTPS webhook URL.
    """
    if not telegram_bot.is_configured:
        logger.warning("Telegram token is not configured. Poller will not start.")
        return

    logger.info("Initializing Telegram Poller for local development...")
    await telegram_bot.delete_webhook()
    offset = 0

    async with httpx.AsyncClient(timeout=40.0) as client:
        while True:
            try:
                url = f"{telegram_bot.base_url}/getUpdates"
                params = {"offset": offset, "timeout": 25}
                res = await client.get(url, params=params)

                if res.status_code == 200:
                    data = res.json()
                    updates = data.get("result", [])

                    for update in updates:
                        update_id = update.get("update_id", 0)
                        offset = max(offset, update_id + 1)

                        if AsyncSessionLocal:
                            async with AsyncSessionLocal() as db:
                                try:
                                    await handle_telegram_update(update, db)
                                except Exception as err:
                                    logger.error(f"Error handling update {update_id}: {err}", exc_info=True)
                elif res.status_code == 409:
                    logger.warning("Conflict with webhook or another bot instance. Retrying in 5s...")
                    await asyncio.sleep(5)
                else:
                    logger.warning(f"Polling error ({res.status_code}): {res.text}")
                    await asyncio.sleep(3)

            except asyncio.CancelledError:
                logger.info("Telegram poller cancelled.")
                break
            except Exception as e:
                logger.error(f"Poller connection error: {e}. Reconnecting in 3s...")
                await asyncio.sleep(3)

if __name__ == "__main__":
    asyncio.run(run_telegram_poller())
