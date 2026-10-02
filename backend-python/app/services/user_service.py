from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update

from app.db.models import User
from app.memory.retrieval import get_user_memories
from app.memory.storage import delete_memory
from app.schemas.auth import UserOut
from app.schemas.users import MemoryOut

class UserService:
    @staticmethod
    def get_profile(user: User) -> UserOut:
        return UserOut.model_validate(user)

    @staticmethod
    async def update_settings(user_id: str, new_settings: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(settings=new_settings)
        )
        await db.execute(stmt)
        await db.commit()
        return new_settings

    @staticmethod
    async def get_memories(user_id: str, db: AsyncSession) -> List[MemoryOut]:
        mems = await get_user_memories(user_id, db, limit=50)
        return [MemoryOut.model_validate(m) for m in mems]

    @staticmethod
    async def delete_memory(memory_id: str, user_id: str, db: AsyncSession) -> bool:
        return await delete_memory(memory_id, user_id, db)
