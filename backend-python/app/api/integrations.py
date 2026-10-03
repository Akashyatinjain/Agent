from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.db.database import get_db
from app.db.models import User
from app.api.deps import get_current_user
from app.integrations.service import ChannelService
from app.core.config import settings

router = APIRouter(prefix="/integrations", tags=["Integrations & Channels"])

class LinkChannelRequest(BaseModel):
    channelType: str  # "TELEGRAM" | "WHATSAPP"

@router.get("/channels")
async def get_connected_channels(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all connected and pending channels for the logged-in user."""
    channels = await ChannelService.get_channels_for_user(db, current_user.id)
    bot_username = settings.TELEGRAM_BOT_USERNAME or "AkashAgentBot"

    return {
        "success": True,
        "channels": channels,
        "telegram": {
            "isConfigured": bool(settings.TELEGRAM_BOT_TOKEN),
            "botUsername": bot_username,
            "botUrl": f"https://t.me/{bot_username}"
        },
        "whatsapp": {
            "isConfigured": bool(settings.WHATSAPP_PHONE_NUMBER or settings.WHATSAPP_ACCOUNT_SID),
            "phoneNumber": settings.WHATSAPP_PHONE_NUMBER
        }
    }

@router.post("/channels/link")
async def start_channel_link(
    req: LinkChannelRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a time-limited 6-digit linking code for Telegram or WhatsApp."""
    channel_type = req.channelType.upper()
    if channel_type not in ("TELEGRAM", "WHATSAPP"):
        raise HTTPException(status_code=400, detail="Unsupported channel type. Use TELEGRAM or WHATSAPP.")

    code = await ChannelService.create_linking_code(db, current_user.id, channel_type)
    bot_username = settings.TELEGRAM_BOT_USERNAME or "AkashAgentBot"
    wa_phone = "".join(filter(str.isdigit, settings.WHATSAPP_PHONE_NUMBER or "+14155238886"))
    deep_link = (
        f"https://t.me/{bot_username}?start={code}"
        if channel_type == "TELEGRAM"
        else f"https://wa.me/{wa_phone}?text=link%20{code}"
    )

    return {
        "success": True,
        "code": code,
        "channelType": channel_type,
        "expiresInMinutes": 15,
        "deepLink": deep_link,
        "botUsername": bot_username,
        "instruction": (
            f"Open Telegram and tap 'Start' or send /link {code}"
            if channel_type == "TELEGRAM"
            else f"Send 'link {code}' to our WhatsApp assistant"
        )
    }

@router.delete("/channels/{channel_type}")
async def disconnect_channel(
    channel_type: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Disconnect a linked Telegram or WhatsApp channel."""
    success = await ChannelService.disconnect_channel(db, current_user.id, channel_type)
    return {
        "success": True,
        "message": f"{channel_type.capitalize()} disconnected successfully."
    }
