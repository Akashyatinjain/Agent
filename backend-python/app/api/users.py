from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User
from app.api.deps import get_current_user
from app.services.user_service import UserService
from app.schemas.users import (
    ProfileResponse, UpdateSettingsRequest, UpdateSettingsResponse,
    MemoriesResponse
)
from app.schemas.common import SuccessResponse

router = APIRouter(tags=["user"])

# Mount at /user and /users for seamless backwards compatibility
@router.get("/user/profile", response_model=ProfileResponse)
@router.get("/users/profile", response_model=ProfileResponse)
@router.get("/user/me", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    user_out = UserService.get_profile(current_user)
    return ProfileResponse(success=True, user=user_out)

@router.put("/user/settings", response_model=UpdateSettingsResponse)
@router.put("/users/settings", response_model=UpdateSettingsResponse)
async def update_settings(
    req: UpdateSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    updated = await UserService.update_settings(current_user.id, req.settings, db)
    return UpdateSettingsResponse(
        success=True,
        settings=updated,
        message="Settings updated successfully"
    )

@router.get("/user/memories", response_model=MemoriesResponse)
@router.get("/users/memories", response_model=MemoriesResponse)
async def get_memories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    memories = await UserService.get_memories(current_user.id, db)
    return MemoriesResponse(success=True, memories=memories)

@router.delete("/user/memories/{id}", response_model=SuccessResponse)
@router.delete("/users/memories/{id}", response_model=SuccessResponse)
async def remove_memory(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await UserService.delete_memory(id, current_user.id, db)
    return SuccessResponse(success=True, message="Memory deleted successfully")
