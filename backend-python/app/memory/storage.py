from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from app.db.models import Memory, generate_cuid
from app.core.logging import logger

async def save_memory(
    user_id: str,
    fact: str,
    category: str = "general",
    db: Optional[AsyncSession] = None
) -> Optional[Memory]:
    """Persist a newly extracted memory into the database."""
    if not db:
        from app.db.database import AsyncSessionLocal
        if not AsyncSessionLocal:
            return None
        async with AsyncSessionLocal() as session:
            try:
                mem = Memory(
                    id=generate_cuid(),
                    userId=user_id,
                    fact=fact.strip(),
                    category=category or "general"
                )
                session.add(mem)
                await session.commit()
                await session.refresh(mem)
                return mem
            except Exception as e:
                logger.warning(f"Failed to save memory: {e}")
                return None

    try:
        mem = Memory(
            id=generate_cuid(),
            userId=user_id,
            fact=fact.strip(),
            category=category or "general"
        )
        db.add(mem)
        await db.commit()
        await db.refresh(mem)
        return mem
    except Exception as e:
        logger.warning(f"Failed to save memory: {e}")
        return None

async def delete_memory(memory_id: str, user_id: str, db: AsyncSession) -> bool:
    """Delete a user memory by ID."""
    try:
        stmt = delete(Memory).where(Memory.id == memory_id, Memory.userId == user_id)
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0
    except Exception as e:
        logger.warning(f"Failed to delete memory: {e}")
        return False
