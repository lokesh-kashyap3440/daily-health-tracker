import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from app.api.ai_estimate import router as ai_estimate_router
from app.api.auth import router as auth_router
from app.api.chatbot import router as chatbot_router
from app.api.daily_logs import router as daily_logs_router
from app.api.health_goals import router as health_goals_router
from app.api.meals import router as meals_router
from app.api.metrics import router as metrics_router
from app.api.suggestions import router as suggestions_router
from app.api.users import router as users_router
from app.api.workouts import router as workouts_router
from app.config import settings
from app.core.exceptions import AppException
from app.core.rabbitmq import rabbitmq_connection
from app.core.redis import redis_client
from app.database import check_db_connection, engine
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware

logger = logging.getLogger("healthtracker")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    logger.info("Starting up Health Tracker API...")

    # Initialize Redis connection
    try:
        await redis_client.initialize()
        logger.info("Redis connected")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}")

    # Initialize RabbitMQ connection
    try:
        await rabbitmq_connection.connect()
        logger.info("RabbitMQ connected")
    except Exception as e:
        logger.warning(f"RabbitMQ connection failed: {e}")

    # Test database connection
    db_ok = await check_db_connection()
    if db_ok:
        logger.info("Database connected")
    else:
        logger.warning("Database connection check failed")

    yield

    # Shutdown
    logger.info("Shutting down Health Tracker API...")
    await redis_client.close()
    await rabbitmq_connection.close()
    await engine.dispose()


app = FastAPI(
    title="Daily Health Tracker API",
    description="A comprehensive health tracking API with AI-powered chatbot and suggestions",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.APP_DEBUG else None,
    redoc_url="/redoc" if settings.APP_DEBUG else None,
)


# ── Middleware Stack ──────────────────────────────────────────────────

# CORS - must be first
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.add_middleware(RateLimitMiddleware)

# Request logging
app.add_middleware(RequestLoggingMiddleware)


# ── Exception Handlers ──────────────────────────────────────────────

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.error_code},
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    errors = exc.errors()
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation failed",
            "code": "VALIDATION_ERROR",
            "errors": [
                {
                    "field": ".".join(str(loc) for loc in err["loc"]),
                    "message": err["msg"],
                }
                for err in errors
            ],
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "code": "INTERNAL_ERROR",
        },
    )


# ── Routers ─────────────────────────────────────────────────────────

app.include_router(ai_estimate_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(daily_logs_router, prefix="/api")
app.include_router(meals_router, prefix="/api")
app.include_router(workouts_router, prefix="/api")
app.include_router(chatbot_router, prefix="/api")
app.include_router(suggestions_router, prefix="/api")
app.include_router(metrics_router, prefix="/api")
app.include_router(health_goals_router, prefix="/api")


# ── Health Check ────────────────────────────────────────────────────

@app.get("/api/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring."""
    db_ok = await check_db_connection()
    redis_ok = await redis_client.ping()

    return {
        "status": "healthy" if (db_ok and redis_ok) else "degraded",
        "version": "1.0.0",
        "database": "connected" if db_ok else "disconnected",
        "redis": "connected" if redis_ok else "disconnected",
        "rabbitmq": "connected" if rabbitmq_connection.is_connected else "disconnected",
        "timestamp": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
    }


# ── Static Frontend (SPA) ───────────────────────────────────────────
# Serves the built frontend when backend/static/ exists (Render production).
# During local dev, the static/ directory is absent and Vite handles the frontend.
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Return JSON 404 for unmatched /api/* paths rather than HTML
        if full_path.startswith("api/"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        # Serve static files (manifest, sw.js, icons, etc.) from the root
        static_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(static_path):
            return FileResponse(static_path)
        # SPA fallback — serve index.html for all other routes
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path, media_type="text/html")
        return JSONResponse({"detail": "Not Found"}, status_code=404)
