from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import Memory

async def get_user_memories(user_id: str, db: AsyncSession, limit: int = 10) -> List[Memory]:
    """Retrieve the most recent memories for a user."""
    try:
        result = await db.execute(
            select(Memory)
            .where(Memory.userId == user_id)
            .order_by(Memory.createdAt.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
    except Exception:
        return []
