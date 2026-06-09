"""
Simple in-memory rate limiter middleware.
Limits requests per IP using sliding window.
"""
import time
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# {ip: [timestamps]}
_request_log: dict[str, list[float]] = defaultdict(list)
WINDOW_SECONDS = 60
MAX_REQUESTS = 100


class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - WINDOW_SECONDS

        # Prune old requests
        _request_log[ip] = [t for t in _request_log[ip] if t > window_start]

        if len(_request_log[ip]) >= MAX_REQUESTS:
            return Response(
                content='{"detail": "Rate limit exceeded. Try again in 60 seconds."}',
                status_code=429,
                media_type="application/json",
            )

        _request_log[ip].append(now)
        return await call_next(request)
