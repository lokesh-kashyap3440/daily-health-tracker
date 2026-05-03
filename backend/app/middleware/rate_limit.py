import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp

from app.config import settings
from app.core.exceptions import RateLimitException
from app.core.redis import redis_client


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ):
        if not request.url.path.startswith("/api/"):
            return await call_next(request)

        # Skip rate limiting for health check
        if request.url.path == "/api/health":
            return await call_next(request)

        # Determine client identifier
        client_id = request.client.host if request.client else "unknown"

        # Get user id from request state if authenticated
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            client_id = str(user_id)

        # Stricter rate limiting for login endpoint
        limit = settings.RATE_LIMIT_PER_MINUTE
        if request.url.path == "/api/auth/login":
            limit = 10

        # Apply separate limit for chat endpoint
        if "/api/chat/" in request.url.path:
            limit = settings.RATE_LIMIT_CHAT_PER_MINUTE

        key = f"rate_limit:{client_id}:{request.url.path}"

        try:
            current = await redis_client.incr(key)
            if current == 1:
                await redis_client.expire(key, 60)

            if current > limit:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": f"Rate limit exceeded. Max {limit} requests per minute.",
                        "code": "RATE_LIMITED",
                    },
                    headers={"Retry-After": "60"},
                )
        except Exception:
            # If Redis is down, allow the request through
            pass

        return await call_next(request)
