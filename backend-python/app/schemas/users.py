from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.auth import UserOut

class MemoryOut(BaseModel):
    id: str
    fact: str
    category: str = "general"
    createdAt: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ProfileResponse(BaseModel):
    success: bool = True
    user: UserOut

class UpdateSettingsRequest(BaseModel):
    settings: Dict[str, Any]

class UpdateSettingsResponse(BaseModel):
    success: bool = True
    settings: Dict[str, Any]
    message: str = "Settings updated successfully"

class MemoriesResponse(BaseModel):
    success: bool = True
    memories: List[MemoryOut]
