from fastapi import APIRouter, Request, Response, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import html

from app.db.database import get_db
from app.integrations.whatsapp.handlers import handle_whatsapp_message
from app.core.config import settings
from app.core.logging import logger

router = APIRouter(prefix="/integrations/whatsapp", tags=["WhatsApp Integration"])

@router.get("/webhook")
async def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge")
):
    """Meta WhatsApp Cloud API verification handshake."""
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN:
        return Response(content=hub_challenge or "", media_type="text/plain")
    return Response(content="Forbidden", status_code=403)

@router.post("/webhook")
async def whatsapp_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle WhatsApp webhook events (supports both Twilio and Meta Cloud format).
    """
    content_type = request.headers.get("content-type", "")

    # 1. Twilio Webhook (application/x-www-form-urlencoded)
    if "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        from_number = form.get("From", "")
        body = form.get("Body", "")
        media_url = form.get("MediaUrl0")
        media_type = form.get("MediaContentType0")
        profile_name = form.get("ProfileName")

        reply_text = await handle_whatsapp_message(
            sender_id=from_number,
            body=body,
            media_url=media_url,
            media_type=media_type,
            sender_name=profile_name,
            db=db
        )

        escaped_reply = html.escape(reply_text)
        twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{escaped_reply}</Message></Response>'
        return Response(content=twiml, media_type="application/xml")

    # 2. Meta WhatsApp Cloud API (application/json)
    try:
        data = await request.json()
    except Exception:
        return {"status": "ignored"}

    entry = data.get("entry", [])
    if not entry:
        return {"status": "ok"}

    changes = entry[0].get("changes", [])
    if not changes:
        return {"status": "ok"}

    value = changes[0].get("value", {})
    messages = value.get("messages", [])
    if not messages:
        return {"status": "ok"}

    msg = messages[0]
    sender_id = msg.get("from", "")
    msg_type = msg.get("type", "text")

    body = ""
    media_url = None
    media_type = None

    if msg_type == "text":
        body = msg.get("text", {}).get("body", "")
    elif msg_type == "audio":
        media_type = "audio/ogg"
        # Meta provides audio ID which requires media URL resolution

    sender_name = value.get("contacts", [{}])[0].get("profile", {}).get("name")

    await handle_whatsapp_message(
        sender_id=sender_id,
        body=body,
        media_url=media_url,
        media_type=media_type,
        sender_name=sender_name,
        db=db
    )

    return {"status": "ok"}
