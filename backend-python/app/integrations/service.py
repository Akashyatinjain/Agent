import random
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from sqlalchemy.orm import selectinload

from app.db.models import User, UserChannel
from app.core.logging import logger

class ChannelService:
    @staticmethod
    def generate_code() -> str:
        """Generate a secure 6-digit linking code."""
        return str(random.randint(100000, 999999))

    @classmethod
    async def create_linking_code(
        cls,
        db: AsyncSession,
        user_id: str,
        channel_type: str
    ) -> str:
        """Create or update a pending 6-digit linking code valid for 15 minutes."""
        code = cls.generate_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        channel_type = channel_type.upper()

        # Find existing unverified or current record for this user & channel
        stmt = select(UserChannel).where(
            and_(
                UserChannel.userId == user_id,
                UserChannel.channelType == channel_type
            )
        )
        result = await db.execute(stmt)
        record = result.scalar_one_or_none()

        if record:
            record.linkingCode = code
            record.linkingCodeExpiresAt = expires_at
        else:
            record = UserChannel(
                userId=user_id,
                channelType=channel_type,
                channelUserId=f"pending_{user_id}",
                linkingCode=code,
                linkingCodeExpiresAt=expires_at,
                isVerified=False
            )
            db.add(record)

        await db.commit()
        await db.refresh(record)
        logger.info(f"Generated linking code for user {user_id} on {channel_type}: {code}")
        return code

    @classmethod
    async def verify_and_link(
        cls,
        db: AsyncSession,
        channel_type: str,
        channel_user_id: str,
        code: str,
        channel_username: Optional[str] = None
    ) -> Optional[User]:
        """Verify linking code and bind channel_user_id to the user."""
        now = datetime.now(timezone.utc)
        channel_type = channel_type.upper()
        clean_code = code.strip()

        stmt = select(UserChannel).options(selectinload(UserChannel.user)).where(
            and_(
                UserChannel.channelType == channel_type,
                UserChannel.linkingCode == clean_code,
                UserChannel.linkingCodeExpiresAt > now
            )
        )
        result = await db.execute(stmt)
        channel_entry = result.scalar_one_or_none()

        if not channel_entry:
            logger.warning(f"Invalid or expired linking code '{clean_code}' for channel {channel_type}")
            return None

        # Clean up any old record with this same channel_user_id
        await db.execute(
            delete(UserChannel).where(
                and_(
                    UserChannel.channelType == channel_type,
                    UserChannel.channelUserId == str(channel_user_id),
                    UserChannel.id != channel_entry.id
                )
            )
        )

        channel_entry.channelUserId = str(channel_user_id)
        channel_entry.channelUsername = channel_username
        channel_entry.isVerified = True
        channel_entry.linkingCode = None
        channel_entry.linkingCodeExpiresAt = None

        await db.commit()
        await db.refresh(channel_entry)

        logger.info(f"Channel {channel_type} successfully linked to user {channel_entry.userId}")
        return channel_entry.user

    @classmethod
    async def get_user_for_channel(
        cls,
        db: AsyncSession,
        channel_type: str,
        channel_user_id: str
    ) -> Optional[User]:
        """Retrieve the verified User linked to this channel user ID."""
        channel_type = channel_type.upper()
        stmt = (
            select(User)
            .join(UserChannel, UserChannel.userId == User.id)
            .where(
                and_(
                    UserChannel.channelType == channel_type,
                    UserChannel.channelUserId == str(channel_user_id),
                    UserChannel.isVerified.is_(True)
                )
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @classmethod
    async def get_channels_for_user(
        cls,
        db: AsyncSession,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Get all connected and pending channels for a user."""
        stmt = select(UserChannel).where(UserChannel.userId == user_id)
        result = await db.execute(stmt)
        channels = result.scalars().all()

        out = []
        for ch in channels:
            out.append({
                "id": ch.id,
                "channelType": ch.channelType,
                "channelUserId": ch.channelUserId if ch.isVerified else None,
                "channelUsername": ch.channelUsername,
                "isVerified": ch.isVerified,
                "hasActiveCode": bool(ch.linkingCode and ch.linkingCodeExpiresAt and ch.linkingCodeExpiresAt > datetime.now(timezone.utc)),
                "createdAt": ch.createdAt.isoformat() if ch.createdAt else None,
                "updatedAt": ch.updatedAt.isoformat() if ch.updatedAt else None
            })
        return out

    @classmethod
    async def disconnect_channel(
        cls,
        db: AsyncSession,
        user_id: str,
        channel_type: str
    ) -> bool:
        """Disconnect and remove a linked channel."""
        channel_type = channel_type.upper()
        stmt = delete(UserChannel).where(
            and_(
                UserChannel.userId == user_id,
                UserChannel.channelType == channel_type
            )
        )
        res = await db.execute(stmt)
        await db.commit()
        return res.rowcount > 0
