import aiosqlite
import pytest

from src import deps
from src.services.activities import ActivityService
from src.services.crypto import CryptoService
from src.services.goals import GoalService
from src.services.notifications import NotificationService
from src.services.ollama_client import OllamaClient
from src.services.progress import ProgressService
from src.services.reminders import ReminderService
from src.services.sentiment import SentimentService


async def test_get_db_yields_working_connection() -> None:
    gen = deps.get_db()
    conn = await gen.__anext__()
    try:
        assert isinstance(conn, aiosqlite.Connection)
        cursor = await conn.execute("SELECT 1")
        row = await cursor.fetchone()
        assert row[0] == 1
    finally:
        with pytest.raises(StopAsyncIteration):
            await gen.__anext__()


def test_get_ollama_returns_client() -> None:
    client = deps.get_ollama()
    try:
        assert isinstance(client, OllamaClient)
    finally:
        # Close synchronously via underlying client attribute; tests are not
        # interested in verifying close behaviour here.
        pass


def test_get_crypto_returns_service() -> None:
    service = deps.get_crypto()
    assert isinstance(service, CryptoService)


async def test_service_factories(db_conn: aiosqlite.Connection, encryption_key: str) -> None:
    ollama = deps.get_ollama()
    activity = deps.get_activity_service(db_conn)
    goal = deps.get_goal_service(db_conn, ollama)
    sentiment = deps.get_sentiment_service(ollama)
    progress = deps.get_progress_service(
        db_conn, CryptoService(key=encryption_key), sentiment
    )
    notifications = deps.get_notification_service(db_conn)
    reminders = deps.get_reminder_service(activity, goal, notifications, ollama)

    assert isinstance(activity, ActivityService)
    assert isinstance(goal, GoalService)
    assert isinstance(sentiment, SentimentService)
    assert isinstance(progress, ProgressService)
    assert isinstance(notifications, NotificationService)
    assert isinstance(reminders, ReminderService)
