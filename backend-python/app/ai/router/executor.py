import time
import json
from typing import Dict, Any, List, Optional, Callable, AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.ai.router.classifier import classify_user_intent, ROUTER_TYPES
from app.ai.prompts.system import SYSTEM_PROMPTS
from app.ai.llm.provider import get_llm_provider
from app.rag.retrieval import retrieve_relevant_chunks
from app.rag.store import in_memory_store
from app.tools.registry import execute_tools
from app.memory.retrieval import get_user_memories
from app.db.models import File
from app.core.logging import logger

async def route_and_execute(
    user_message: str,
    user_id: str,
    provider: str = "gemini",
    history: Optional[List[Dict[str, Any]]] = None,
    attached_file: Optional[Dict[str, Any]] = None,
    db: Optional[AsyncSession] = None,
    on_chunk: Optional[Callable[[str], None]] = None,
    on_metadata: Optional[Callable[[Dict[str, Any]], None]] = None
) -> Dict[str, Any]:
    """Execute the full AI router pipeline: classification -> tools / RAG -> memory -> LLM streaming."""
    start_time = time.time()
    logger.info(f"Classifying incoming message for user {user_id}...")

    # Step 1: Intelligent Intent Classification
    classification = await classify_user_intent(user_message)
    pipeline = classification.get("pipeline", ROUTER_TYPES["CHAT"])

    # If user explicitly attached a document to this message, ensure RAG pipeline
    if attached_file and attached_file.get("id"):
        pipeline = ROUTER_TYPES["HYBRID"] if pipeline == ROUTER_TYPES["TOOL"] else ROUTER_TYPES["RAG"]

    metadata_payload = {
        "routerType": pipeline,
        "reasoning": classification.get("reasoning", ""),
        "toolsUsed": classification.get("toolsNeeded", []),
        "ragQuery": classification.get("ragQuery", ""),
        "attachedFile": attached_file
    }

    if on_metadata:
        on_metadata(metadata_payload)

    # Fetch list of user's uploaded files only when relevant to document retrieval
    user_uploaded_files = []
    if db is not None and (
        pipeline in (ROUTER_TYPES["RAG"], ROUTER_TYPES["HYBRID"])
        or (attached_file and attached_file.get("id"))
    ):
        try:
            stmt = select(File).where(File.userId == user_id).order_by(File.createdAt.desc())
            db_res = await db.execute(stmt)
            for f in db_res.scalars().all():
                user_uploaded_files.append({
                    "id": f.id,
                    "name": f.name,
                    "size": f.size,
                    "type": f.type
                })
        except Exception:
            pass

    # Merge with in-memory files
    mem_files = in_memory_store.get_documents(user_id)
    seen_ids = {f["id"] for f in user_uploaded_files}
    for mf in mem_files:
        if mf.get("id") not in seen_ids:
            user_uploaded_files.append(mf)
            seen_ids.add(mf.get("id"))

    rag_context_text = ""
    rag_chunks = []
    tool_results = []

    # Step 2: RAG Pipeline Execution (only when requested or file attached)
    if (
        pipeline in (ROUTER_TYPES["RAG"], ROUTER_TYPES["HYBRID"])
        or (attached_file and attached_file.get("id"))
    ):
        try:
            query_to_search = classification.get("ragQuery") or user_message
            target_file_id = attached_file.get("id") if attached_file else None

            raw_chunks = await retrieve_relevant_chunks(
                query=query_to_search,
                user_id=user_id,
                db=db,
                file_id=target_file_id,
                top_k=6,
                min_similarity=0.15
            )

            if raw_chunks:
                rag_chunks = raw_chunks[:5]
                rag_parts = []
                for i, c in enumerate(rag_chunks):
                    fname = c.get("metadata", {}).get("filename") or "Document"
                    page_info = f" (Page {c.get('metadata', {}).get('pageNumber')})" if c.get("metadata", {}).get("pageNumber") else ""
                    rag_parts.append(f"[Source {i + 1}: {fname}{page_info}]\n{c.get('content', '')}")
                rag_context_text = "\n\n".join(rag_parts)
        except Exception as rag_err:
            logger.warning(f"RAG retrieval warning: {rag_err}")

    # Step 3: Tool Pipeline Execution
    if pipeline in (ROUTER_TYPES["TOOL"], ROUTER_TYPES["HYBRID"]):
        try:
            tools_to_run = classification.get("toolsNeeded") or ["web_search"]
            tool_results = await execute_tools(tools_to_run, user_message)
        except Exception as tool_err:
            logger.warning(f"Tool execution warning: {tool_err}")

    # Step 4: Inject User Memories
    user_memories = []
    if db is not None:
        try:
            mems = await get_user_memories(user_id, db, limit=10)
            user_memories = [m.fact for m in mems]
        except Exception:
            pass

    memory_context_text = ""
    if user_memories:
        memory_context_text = "USER PROFILE & REMEMBERED FACTS:\n" + "\n".join(f"- {m}" for m in user_memories)

    # Step 5: Assemble Unified System Prompt
    system_prompt = SYSTEM_PROMPTS["GENERAL"]

    if user_uploaded_files:
        file_list_text = "\n".join(
            f'- "{f.get("name")}" ({(f.get("size", 0) / 1024):.1f} KB)'
            for f in user_uploaded_files
        )
        system_prompt += f"\n\nUSER'S UPLOADED DOCUMENTS IN KNOWLEDGE BASE:\n{file_list_text}\nYou have full access to these documents through the pgvector RAG pipeline. When the user asks about their resume, uploaded files, or documents, reference their contents directly."

    if memory_context_text:
        system_prompt += f"\n\n{memory_context_text}"

    if rag_context_text:
        system_prompt += f"\n\n{SYSTEM_PROMPTS['RAG_CONTEXT'].replace('{{ragContext}}', rag_context_text)}"

    if tool_results:
        formatted_tool_data = [
            {
                "tool": t.get("tool"),
                "success": t.get("success"),
                "data": t.get("result") if t.get("result") is not None else (t.get("results") or t.get("error") or "Execution completed")
            }
            for t in tool_results
        ]
        system_prompt += f"\n\n{SYSTEM_PROMPTS['TOOL_CONTEXT'].replace('{{toolContext}}', json.dumps(formatted_tool_data, indent=2))}"

    # Step 6: Multi-Provider LLM Response Execution
    llm = get_llm_provider(provider)
    final_response_text = ""

    if on_chunk:
        async for chunk in llm.stream(
            prompt=user_message,
            system_prompt=system_prompt,
            history=history
        ):
            final_response_text += chunk
            on_chunk(chunk)
    else:
        final_response_text = await llm.generate(
            prompt=user_message,
            system_prompt=system_prompt,
            history=history
        )

    duration_ms = int((time.time() - start_time) * 1000)
    logger.info(f"Completed routing and execution via [{pipeline}] pipeline in {duration_ms}ms")

    return {
        "response": final_response_text,
        "metadata": {
            "pipeline": pipeline,
            "reasoning": classification.get("reasoning", ""),
            "ragChunks": rag_chunks,
            "toolResults": tool_results,
            "memoriesUsed": len(user_memories),
            "attachedFile": attached_file,
            "durationMs": duration_ms
        }
    }
