from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class AttachedFile(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    size: Optional[int] = None
    s3Url: Optional[str] = None
    s3Key: Optional[str] = None

class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversationId: Optional[str] = None
    model: Optional[str] = "gemini"
    isStream: Optional[bool] = True
    attachedFile: Optional[Dict[str, Any]] = None

class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    conversationId: str
    model: Optional[str] = None
    routerType: Optional[str] = None
    toolCalls: Optional[Any] = None
    ragContext: Optional[Any] = None
    tokenCount: Optional[int] = None
    createdAt: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ConversationCount(BaseModel):
    messages: int = 0

class ConversationListItem(BaseModel):
    id: str
    title: str
    model: str
    createdAt: datetime
    updatedAt: datetime
    _count: Optional[ConversationCount] = None

    model_config = ConfigDict(from_attributes=True)

class ConversationDetail(BaseModel):
    id: str
    title: str
    userId: str
    model: str
    createdAt: datetime
    updatedAt: datetime
    messages: List[MessageOut] = []

    model_config = ConfigDict(from_attributes=True)

class ConversationsResponse(BaseModel):
    success: bool = True
    conversations: List[ConversationListItem]

class ConversationResponse(BaseModel):
    success: bool = True
    conversation: ConversationDetail

class RenameConversationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)

class RenameConversationResponse(BaseModel):
    success: bool = True
    title: str
    message: str = "Conversation renamed successfully"
