import logging
import os
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from src.config import cors_origin
from src.db import init_db, open_connection
from src.routers import activities, chat, checkins, goals, notifications
from src.schemas import GoalCreate
from src.services.activities import ActivityService
from src.services.goals import GoalService
from src.services.notifications import NotificationService
from src.services.ollama_client import OllamaClient
from src.services.reminders import ReminderService
from src.services.scheduler import build_scheduler

LOGGER = logging.getLogger(__name__)

APP_VERSION = "1.0.0"


async def _scheduled_checkin() -> None:  # pragma: no cover - runs under APScheduler
    conn = await open_connection()
    ollama = OllamaClient()
    try:
        reminders = ReminderService(
            ActivityService(conn),
            GoalService(conn, ollama),
            NotificationService(conn),
            ollama,
        )
        await reminders.run_checkin()
    finally:
        await ollama.close()
        await conn.close()


@asynccontextmanager
async def lifespan(fastapi_app: FastAPI) -> AsyncIterator[None]:
    await init_db()
    scheduler = None
    if os.getenv("ENABLE_SCHEDULER", "false").lower() == "true":  # pragma: no cover - exercised only in containers
        scheduler = build_scheduler(_scheduled_checkin)
        scheduler.start()
        fastapi_app.state.scheduler = scheduler
    try:
        yield
    finally:
        if scheduler is not None:  # pragma: no cover - exercised only in containers
            scheduler.shutdown(wait=False)


app = FastAPI(
    title="Resolution Tracker",
    version=APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[cors_origin()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(404)
async def custom_404_handler(request: Request, _: Exception) -> JSONResponse:
    headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Cross-Origin-Resource-Policy": "same-origin",
    }
    LOGGER.info("Not found path=%s", request.url.path)
    return JSONResponse(
        status_code=404, content={"detail": "Not Found"}, headers=headers
    )


@app.get("/robots.txt", include_in_schema=False)
def robots() -> Response:
    return Response(
        content="User-agent: *\nDisallow: /", media_type="text/plain"
    )


@app.get("/sitemap.xml", include_in_schema=False)
def sitemap() -> Response:
    return Response(
        content='<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>',
        media_type="application/xml",
    )


@app.middleware("http")
async def add_security_headers(request: Any, call_next: Any) -> Any:  # pragma: no cover
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["Server"] = "Hidden"
    response.headers["Cache-Control"] = (
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    )
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    return response


@app.get("/")
async def read_root() -> dict[str, str]:
    return {"status": "Resolution Tracker Online", "version": APP_VERSION}


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(activities.router)
app.include_router(goals.router)
app.include_router(checkins.router)
app.include_router(notifications.router)
app.include_router(chat.router)


def validate_goal_payload(data: dict[str, Any]) -> bool:
    """Legacy helper kept for parity with historical schema-validation tests."""
    try:
        GoalCreate(**data)
        return True
    except ValidationError as error:
        LOGGER.warning("Invalid goal payload rejected: %s", error.errors())
        return False
