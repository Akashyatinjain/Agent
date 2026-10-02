from typing import Optional
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import User
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException
from app.core.logging import logger

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency that authenticates the user via JWT Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException(
            code="TOKEN_MISSING",
            message="Authentication token is missing. Please log in."
        )

    token = authorization.split("Bearer ")[1].strip()
    payload = decode_access_token(token)
    if not payload:
        raise UnauthorizedException(
            code="TOKEN_INVALID",
            message="Invalid or expired authentication token. Please log in again."
        )

    user_id = payload.get("id")
    if not user_id:
        raise UnauthorizedException(
            code="TOKEN_PAYLOAD_INVALID",
            message="Malformed token payload."
        )

    # Retrieve user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException(
            code="USER_NOT_FOUND",
            message="The user associated with this token no longer exists."
        )

    return user
