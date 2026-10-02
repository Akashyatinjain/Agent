import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.core.exceptions import RateLimitException

class InMemoryRateLimiter:
    def __init__(self, window_seconds: int = 60, max_requests: int = 120):
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        self.requests = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        window_start = now - self.window_seconds
        timestamps = self.requests[client_ip]
        # Filter timestamps within current window
        valid_timestamps = [t for t in timestamps if t > window_start]
        self.requests[client_ip] = valid_timestamps

        if len(valid_timestamps) >= self.max_requests:
            return False

        self.requests[client_ip].append(now)
        return True

limiter = InMemoryRateLimiter(window_seconds=60, max_requests=120)

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip health checks and static files
        path = request.url.path
        if path.startswith("/api/health") or path.startswith("/uploads"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        if not limiter.is_allowed(client_ip):
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please slow down and try again later."
                    }
                }
            )
        return await call_next(request)
