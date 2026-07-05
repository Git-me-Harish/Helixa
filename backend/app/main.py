"""Helixa FastAPI application — entry point."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.limiter import limiter
from app.database import create_tables
from app.routers import analytics, appointments, auth, chat, documents, extended_records, health_records, speech

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Helixa starting up...")

    # Ensure upload directory exists
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

    # Create database tables
    try:
        await create_tables()
        logger.info("Database tables ready")
    except Exception as exc:
        logger.error("Database init failed: %s", exc)

    # Pre-warm NLP pipeline (optional — speeds up first request)
    try:
        from app.services.nlp_service import _get_pipeline
        _get_pipeline()
    except Exception:
        pass

    # Pre-warm Qdrant client
    try:
        from app.services.rag_service import _get_client
        _get_client()
    except Exception:
        pass

    logger.info("Helixa ready on http://0.0.0.0:8000")
    yield

    # Shutdown
    logger.info("Helixa shutting down...")


app = FastAPI(
    title="Helixa AI Healthcare Platform",
    description="AI-native healthcare operating system — secure, comprehensive, intelligent",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Middleware ───────────────────────────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

# ─── Exception handlers ───────────────────────────────────────────────────────
register_exception_handlers(app)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(health_records.router)
app.include_router(documents.router)
app.include_router(appointments.router)
app.include_router(analytics.router)
app.include_router(speech.router)
app.include_router(extended_records.router)


@app.get("/api/health")
async def health_check() -> dict:
    return {"status": "healthy", "service": "helixa-api", "version": "1.0.0"}
