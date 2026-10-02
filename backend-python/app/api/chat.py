from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User
from app.api.deps import get_current_user
from app.services.chat_service import ChatService
from app.schemas.chat import (
    SendMessageRequest, ConversationsResponse, ConversationResponse,
    RenameConversationRequest, RenameConversationResponse
)
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/message")
async def send_message(
    req: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a message to the AI assistant with SSE streaming or synchronous JSON response."""
    if req.isStream is not False:
        return StreamingResponse(
            ChatService.stream_chat_response(req, current_user.id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    else:
        # Non-streaming execution
        from app.ai.router.executor import route_and_execute
        clean_message = req.message.strip()
        conv = await ChatService.get_or_create_conversation(
            user_id=current_user.id,
            conversation_id=req.conversationId,
            message=clean_message,
            model=req.model or "gemini",
            attached_file=req.attachedFile,
            db=db
        )
        history = await ChatService.get_conversation_history(conv.id, db)
        exec_result = await route_and_execute(
            user_message=clean_message,
            user_id=current_user.id,
            provider=req.model or "gemini",
            history=history,
            attached_file=req.attachedFile,
            db=db
        )
        return {
            "success": True,
            "conversationId": conv.id,
            "response": exec_result["response"],
            "metadata": exec_result["metadata"]
        }

@router.get("/conversations", response_model=ConversationsResponse)
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all conversations for authenticated user."""
    convs = await ChatService.list_conversations(current_user.id, db)
    return ConversationsResponse(success=True, conversations=convs)

@router.get("/conversations/{id}", response_model=ConversationResponse)
async def get_conversation_by_id(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve a single conversation and all its messages."""
    conv = await ChatService.get_conversation_by_id(id, current_user.id, db)
    return ConversationResponse(success=True, conversation=conv)

@router.patch("/conversations/{id}", response_model=RenameConversationResponse)
async def rename_conversation(
    id: str,
    req: RenameConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Rename a conversation title."""
    new_title = await ChatService.rename_conversation(id, req.title, current_user.id, db)
    return RenameConversationResponse(
        success=True,
        title=new_title,
        message="Conversation renamed successfully"
    )

@router.delete("/conversations/{id}", response_model=SuccessResponse)
async def delete_conversation(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a conversation and all its messages."""
    await ChatService.delete_conversation(id, current_user.id, db)
    return SuccessResponse(success=True, message="Conversation deleted successfully")
