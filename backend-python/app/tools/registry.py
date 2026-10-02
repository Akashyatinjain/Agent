import time
import asyncio
from typing import Dict, Any, List

from app.tools.calculator import execute_calculator
from app.tools.weather import execute_weather
from app.tools.web_search import execute_web_search
from app.core.logging import logger

async def execute_tool_by_name(tool_name: str, query: str) -> Dict[str, Any]:
    """Execute a single tool by name with timing."""
    start_time = time.time()
    normalized_name = (tool_name or "").lower().strip()

    try:
        if normalized_name in ("calculator", "math", "calc"):
            result = await execute_calculator(query)
        elif normalized_name in ("weather", "forecast", "temperature"):
            result = await execute_weather(query)
        elif normalized_name in ("web_search", "search", "google", "web"):
            result = await execute_web_search(query)
        else:
            logger.warning(f"Unrecognized tool requested: {tool_name}")
            return {
                "success": False,
                "tool": tool_name,
                "error": f'Tool "{tool_name}" is not registered in AkashAgent registry.',
                "durationMs": int((time.time() - start_time) * 1000)
            }

        result["durationMs"] = int((time.time() - start_time) * 1000)
        return result
    except Exception as error:
        logger.error(f'Tool "{tool_name}" error: {error}')
        return {
            "success": False,
            "tool": tool_name,
            "error": f"Execution error in tool {tool_name}: {str(error)}",
            "durationMs": int((time.time() - start_time) * 1000)
        }

async def execute_tools(tool_list: List[str], query: str) -> List[Dict[str, Any]]:
    """Execute multiple tools concurrently with deduplication and cap."""
    if not tool_list:
        return []

    # Deduplicate and cap to 3
    seen = set()
    unique_tools = []
    for t in tool_list:
        if t and t not in seen:
            seen.add(t)
            unique_tools.append(t)
            if len(unique_tools) >= 3:
                break

    tasks = [execute_tool_by_name(name, query) for name in unique_tools]
    results = await asyncio.gather(*tasks)
    return list(results)
