from collections.abc import AsyncIterator

import aiosqlite
from fastapi import Depends

from src.db import open_connection
from src.services.activities import ActivityService
from src.services.crypto import CryptoService
from src.services.goals import GoalService
from src.services.notifications import NotificationService
from src.services.ollama_client import OllamaClient
from src.services.progress import ProgressService
from src.services.reminders import ReminderService
from src.services.sentiment import SentimentService


async def get_db() -> AsyncIterator[aiosqlite.Connection]:
    conn = await open_connection()
    try:
        yield conn
    finally:
        await conn.close()


def get_ollama() -> OllamaClient:
    return OllamaClient()


def get_crypto() -> CryptoService:
    return CryptoService()


def get_activity_service(
    conn: aiosqlite.Connection = Depends(get_db),
) -> ActivityService:
    return ActivityService(conn)


def get_goal_service(
    conn: aiosqlite.Connection = Depends(get_db),
    ollama: OllamaClient = Depends(get_ollama),
) -> GoalService:
    return GoalService(conn, ollama)


def get_sentiment_service(
    ollama: OllamaClient = Depends(get_ollama),
) -> SentimentService:
    return SentimentService(ollama)


def get_progress_service(
    conn: aiosqlite.Connection = Depends(get_db),
    crypto: CryptoService = Depends(get_crypto),
    sentiment: SentimentService = Depends(get_sentiment_service),
) -> ProgressService:
    return ProgressService(conn, crypto, sentiment)


def get_notification_service(
    conn: aiosqlite.Connection = Depends(get_db),
) -> NotificationService:
    return NotificationService(conn)


def get_reminder_service(
    activities: ActivityService = Depends(get_activity_service),
    goals: GoalService = Depends(get_goal_service),
    notifications: NotificationService = Depends(get_notification_service),
    ollama: OllamaClient = Depends(get_ollama),
) -> ReminderService:
    return ReminderService(activities, goals, notifications, ollama)
