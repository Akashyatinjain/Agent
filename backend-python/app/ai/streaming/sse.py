import json
from typing import Any

def format_sse_event(event_name: str, data: Any) -> str:
    """Format SSE event strictly compatible with frontend reader:
    event: <event_name>
    data: <json_data>

    """
    if isinstance(data, (dict, list)):
        payload = json.dumps(data)
    elif isinstance(data, str):
        try:
            # If already valid JSON string, keep it, otherwise wrap
            json.loads(data)
            payload = data
        except Exception:
            payload = json.dumps({"chunk": data})
    else:
        payload = json.dumps({"value": str(data)})

    return f"event: {event_name}\ndata: {payload}\n\n"

def format_sse_heartbeat() -> str:
    """Comment line for keeping HTTP connection alive through proxies."""
    return ": heartbeat\n\n"
