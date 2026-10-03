from fastapi import APIRouter, Request, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.db.database import get_db, AsyncSessionLocal
from app.integrations.telegram.bot import telegram_bot
from app.integrations.telegram.handlers import handle_telegram_update
from app.core.logging import logger

router = APIRouter(prefix="/integrations/telegram", tags=["Telegram Integration"])

async def process_telegram_bg(update: Dict[str, Any]):
    """Process telegram update in background session so webhook responds within 200ms."""
    if AsyncSessionLocal is None:
        return
    async with AsyncSessionLocal() as session:
        try:
            await handle_telegram_update(update, session)
        except Exception as e:
            logger.error(f"Error processing background Telegram update: {e}", exc_info=True)

@router.post("/webhook")
async def telegram_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Telegram incoming webhook endpoint."""
    try:
        update = await request.json()
    except Exception:
        return {"ok": False, "error": "Invalid JSON"}

    # Process in background task to guarantee Telegram's 3-second SLA
    background_tasks.add_task(process_telegram_bg, update)
    return {"ok": True}

@router.get("/status")
async def telegram_status():
    """Check Telegram bot status and configuration."""
    if not telegram_bot.is_configured:
        return {
            "configured": False,
            "message": "TELEGRAM_BOT_TOKEN is not set in environment."
        }

    bot_info = await telegram_bot.get_me()
    if bot_info:
        return {
            "configured": True,
            "bot": bot_info
        }
    return {
        "configured": False,
        "message": "Token is set, but could not authenticate with Telegram API."
    }

@router.post("/setup")
async def setup_telegram_webhook(request: Request):
    """Set or remove Telegram webhook URL."""
    body = await request.json()
    webhook_url = body.get("webhook_url")

    if not telegram_bot.is_configured:
        raise HTTPException(status_code=400, detail="Telegram bot token not configured.")

    if webhook_url:
        success = await telegram_bot.set_webhook(webhook_url)
        return {"success": success, "webhook_url": webhook_url}
    else:
        success = await telegram_bot.delete_webhook()
        return {"success": success, "message": "Webhook deleted; ready for polling."}
