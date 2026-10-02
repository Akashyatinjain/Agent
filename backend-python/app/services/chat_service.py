import asyncio
import json
from typing import AsyncIterator, Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload

from app.db.models import Conversation, Message, generate_cuid
from app.db.database import AsyncSessionLocal
from app.ai.router.executor import route_and_execute
from app.ai.streaming.sse import format_sse_event, format_sse_heartbeat
from app.memory.extraction import extract_memories_from_conversation
from app.memory.storage import save_memory
from app.core.exceptions import NotFoundException, BadRequestException
from app.core.logging import logger
from app.schemas.chat import (
    SendMessageRequest, ConversationListItem, ConversationDetail,
    MessageOut, ConversationCount
)

class ChatService:
    @staticmethod
    async def get_or_create_conversation(
        user_id: str,
        conversation_id: Optional[str],
        message: str,
        model: str,
        attached_file: Optional[Dict[str, Any]],
        db: AsyncSession
    ) -> Conversation:
        if conversation_id:
            stmt = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.userId == user_id
            )
            res = await db.execute(stmt)
            conv = res.scalar_one_or_none()
            if conv:
                return conv

        # Generate title from first line of message
        first_line = message.split('\n')[0].strip()
        title = first_line[:36] + '...' if len(first_line) > 36 else first_line
        if attached_file and attached_file.get("name"):
            title = f"📄 {attached_file.get('name')}"

        new_conv = Conversation(
            id=generate_cuid(),
            title=title or "New conversation",
            userId=user_id,
            model=model or "gemini"
        )
        db.add(new_conv)
        await db.commit()
        await db.refresh(new_conv)
        return new_conv

    @staticmethod
    async def get_conversation_history(conversation_id: str, db: AsyncSession, limit: int = 20) -> List[Dict[str, str]]:
        stmt = (
            select(Message)
            .where(Message.conversationId == conversation_id)
            .order_by(Message.createdAt.asc())
            .limit(limit)
        )
        res = await db.execute(stmt)
        messages = res.scalars().all()
        return [
            {
                "role": "assistant" if (m.role or "").lower() == "assistant" else "user",
                "content": m.content
            }
            for m in messages
        ]

    @staticmethod
    async def stream_chat_response(
        req: SendMessageRequest,
        user_id: str
    ) -> AsyncIterator[str]:
        """Stream SSE events for chat turn with AI routing and background persistence."""
        clean_message = req.message.strip()
        active_conversation_id = req.conversationId
        is_new_conversation = not active_conversation_id
        history: List[Dict[str, str]] = []

        if is_new_conversation:
            active_conversation_id = generate_cuid()
            first_line = clean_message.split('\n')[0].strip()
            title = first_line[:36] + '...' if len(first_line) > 36 else first_line
            if req.attachedFile and req.attachedFile.get("name"):
                title = f"📄 {req.attachedFile.get('name')}"

            # Emit initial metadata event immediately with zero delay
            yield format_sse_event("metadata", {
                "conversationId": active_conversation_id,
                "model": req.model or "gemini"
            })

            # Asynchronously persist new conversation and initial user message
            async def persist_new_conv():
                try:
                    async with AsyncSessionLocal() as init_db:
                        new_conv = Conversation(
                            id=active_conversation_id,
                            title=title or "New conversation",
                            userId=user_id,
                            model=req.model or "gemini"
                        )
                        user_msg = Message(
                            id=generate_cuid(),
                            role="USER",
                            content=clean_message,
                            conversationId=active_conversation_id,
                            ragContext=req.attachedFile
                        )
                        init_db.add(new_conv)
                        init_db.add(user_msg)
                        await init_db.commit()
                except Exception as err:
                    logger.error(f"Failed to persist initial conversation/message: {err}")

            asyncio.create_task(persist_new_conv())
        else:
            # Existing conversation: fetch history and append user message in one session
            yield format_sse_event("metadata", {
                "conversationId": active_conversation_id,
                "model": req.model or "gemini"
            })
            try:
                async with AsyncSessionLocal() as db:
                    user_msg = Message(
                        id=generate_cuid(),
                        role="USER",
                        content=clean_message,
                        conversationId=active_conversation_id,
                        ragContext=req.attachedFile
                    )
                    db.add(user_msg)
                    history = await ChatService.get_conversation_history(active_conversation_id, db)
                    await db.commit()
            except Exception as db_err:
                logger.warning(f"Error fetching history for conv {active_conversation_id}: {db_err}")
                history = []

        queue = asyncio.Queue()

        def handle_chunk(chunk: str):
            queue.put_nowait(("token", {"chunk": chunk}))

        def handle_metadata(meta: Dict[str, Any]):
            queue.put_nowait(("router_intent", meta))

        async def run_pipeline():
            try:
                async with AsyncSessionLocal() as local_db:
                    exec_result = await route_and_execute(
                        user_message=clean_message,
                        user_id=user_id,
                        provider=req.model or "gemini",
                        history=history,
                        attached_file=req.attachedFile,
                        db=local_db,
                        on_chunk=handle_chunk,
                        on_metadata=handle_metadata
                    )
                    queue.put_nowait(("completed", exec_result))
            except Exception as e:
                logger.error(f"Chat pipeline error: {e}", exc_info=True)
                queue.put_nowait(("error", {"code": "CHAT_ERROR", "message": str(e)}))

        pipeline_task = asyncio.create_task(run_pipeline())

        full_response_text = ""
        metadata_res = {}

        try:
            while True:
                try:
                    event_type, event_data = await asyncio.wait_for(queue.get(), timeout=15.0)
                except asyncio.TimeoutError:
                    # Send keep-alive heartbeat comment to prevent proxy timeout
                    yield format_sse_heartbeat()
                    continue

                if event_type == "token":
                    full_response_text += event_data.get("chunk", "")
                    yield format_sse_event("token", event_data)
                elif event_type == "router_intent":
                    yield format_sse_event("router_intent", event_data)
                elif event_type == "error":
                    yield format_sse_event("error", event_data)
                    break
                elif event_type == "completed":
                    metadata_res = event_data.get("metadata", {})
                    break
        finally:
            if not pipeline_task.done():
                pipeline_task.cancel()

        # Emit completion
        yield format_sse_event("end", {"status": "completed"})

        # Background persistence of assistant message and memory extraction via create_task
        if full_response_text:
            async def persist_and_extract(cid: str, text: str, meta: dict, uid: str, usr_msg: str, model_name: str):
                async with AsyncSessionLocal() as persist_db:
                    try:
                        assistant_msg = Message(
                            id=generate_cuid(),
                            role="ASSISTANT",
                            content=text,
                            conversationId=cid,
                            model=model_name,
                            routerType=meta.get("pipeline"),
                            toolCalls=meta.get("toolResults") or None,
                            ragContext=meta.get("ragChunks") or None
                        )
                        persist_db.add(assistant_msg)
                        await persist_db.execute(
                            update(Conversation)
                            .where(Conversation.id == cid)
                            .values(updatedAt=func.now())
                        )
                        await persist_db.commit()
                    except Exception as db_err:
                        logger.error(f"Failed to persist assistant message: {db_err}")

                try:
                    extracted = await extract_memories_from_conversation(usr_msg, text)
                    if extracted.get("hasFact") and extracted.get("fact"):
                        await save_memory(
                            user_id=uid,
                            fact=extracted["fact"],
                            category=extracted.get("category", "general")
                        )
                except Exception:
                    pass

            asyncio.create_task(persist_and_extract(
                active_conversation_id,
                full_response_text,
                metadata_res,
                user_id,
                clean_message,
                req.model or "gemini"
            ))

    @staticmethod
    async def list_conversations(user_id: str, db: AsyncSession) -> List[ConversationListItem]:
        """List all conversations for user with message count, ordered by latest updated."""
        stmt = (
            select(
                Conversation,
                func.count(Message.id).label("msg_count")
            )
            .outerjoin(Message, Message.conversationId == Conversation.id)
            .where(Conversation.userId == user_id)
            .group_by(Conversation.id)
            .order_by(Conversation.updatedAt.desc())
        )
        res = await db.execute(stmt)
        rows = res.all()

        conversations = []
        for conv, count in rows:
            conversations.append(
                ConversationListItem(
                    id=conv.id,
                    title=conv.title,
                    model=conv.model,
                    createdAt=conv.createdAt,
                    updatedAt=conv.updatedAt,
                    _count=ConversationCount(messages=count)
                )
            )
        return conversations

    @staticmethod
    async def get_conversation_by_id(conversation_id: str, user_id: str, db: AsyncSession) -> ConversationDetail:
        """Fetch conversation by ID with all messages ordered chronologically."""
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id, Conversation.userId == user_id)
        )
        res = await db.execute(stmt)
        conv = res.scalar_one_or_none()

        if not conv:
            raise NotFoundException(
                code="CONVERSATION_NOT_FOUND",
                message="Conversation not found or has been deleted."
            )

        messages_out = [
            MessageOut(
                id=m.id,
                role=(m.role or "").lower(),
                content=m.content,
                conversationId=m.conversationId,
                model=m.model,
                routerType=m.routerType,
                toolCalls=m.toolCalls,
                ragContext=m.ragContext,
                tokenCount=m.tokenCount,
                createdAt=m.createdAt
            )
            for m in (conv.messages or [])
        ]

        return ConversationDetail(
            id=conv.id,
            title=conv.title,
            userId=conv.userId,
            model=conv.model,
            createdAt=conv.createdAt,
            updatedAt=conv.updatedAt,
            messages=messages_out
        )

    @staticmethod
    async def rename_conversation(conversation_id: str, new_title: str, user_id: str, db: AsyncSession) -> str:
        clean_title = new_title.strip()[:80]
        if not clean_title:
            raise BadRequestException(code="INVALID_TITLE", message="Conversation title is required.")

        stmt = (
            update(Conversation)
            .where(Conversation.id == conversation_id, Conversation.userId == user_id)
            .values(title=clean_title, updatedAt=func.now())
        )
        result = await db.execute(stmt)
        await db.commit()

        if result.rowcount == 0:
            raise NotFoundException(code="CONVERSATION_NOT_FOUND", message="Conversation not found.")

        return clean_title

    @staticmethod
    async def delete_conversation(conversation_id: str, user_id: str, db: AsyncSession) -> bool:
        stmt = delete(Conversation).where(Conversation.id == conversation_id, Conversation.userId == user_id)
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0
