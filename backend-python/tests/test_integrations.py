import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from app.integrations.service import ChannelService
from app.integrations.telegram.bot import TelegramBot
from app.db.models import User, UserChannel
from app.core.security import hash_password

@pytest.mark.asyncio
async def test_channel_service_generate_code():
    code = ChannelService.generate_code()
    assert len(code) == 6
    assert code.isdigit()

@pytest.mark.asyncio
async def test_telegram_bot_unconfigured():
    bot = TelegramBot(token=None)
    assert bot.is_configured is False
    assert await bot.get_me() is None
    assert await bot.send_chat_action("123", "typing") is False
    assert await bot.send_message("123", "Hello") is None
