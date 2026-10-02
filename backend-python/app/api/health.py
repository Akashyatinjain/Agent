import time
from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter()
start_time = time.time()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "akashagent-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime": round(time.time() - start_time, 2)
    }
