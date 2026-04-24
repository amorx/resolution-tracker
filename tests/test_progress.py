import aiosqlite
import pytest
from cryptography.fernet import Fernet
from freezegun import freeze_time

from src.services.crypto import CryptoService
from src.services.progress import ProgressService
from src.services.sentiment import SentimentService
from tests.conftest import FakeOllama


def _progress(db_conn: aiosqlite.Connection) -> ProgressService:
    key = Fernet.generate_key().decode("utf-8")
    sentiment = SentimentService(
        FakeOllama(
            json_response={
                "sentiment": "positive",
                "score": 0.7,
                "summary": "User feels upbeat",
            }
        )
    )
    return ProgressService(db_conn, CryptoService(key=key), sentiment)


async def test_record_encrypts_and_stores_analysis(
    db_conn: aiosqlite.Connection,
) -> None:
    service = _progress(db_conn)
    with freeze_time("2026-04-24"):
        result = await service.record("Felt strong in my workout today.")
    assert result["sentiment"] == "positive"
    assert result["score"] == 0.7
    cursor = await db_conn.execute(
        "SELECT encrypted_text FROM progress_notes WHERE id = ?",
        (result["id"],),
    )
    row = await cursor.fetchone()
    assert row["encrypted_text"] != "Felt strong in my workout today."


async def test_record_rejects_blank(db_conn: aiosqlite.Connection) -> None:
    service = _progress(db_conn)
    with pytest.raises(ValueError, match="required"):
        await service.record("   ")


async def test_recent_decrypts_and_orders(
    db_conn: aiosqlite.Connection,
) -> None:
    service = _progress(db_conn)
    await service.record("first entry", entry_date="2026-04-22")
    await service.record("second entry", entry_date="2026-04-23")
    rows = await service.recent(limit=5)
    assert rows[0]["text"] == "second entry"
    assert rows[1]["text"] == "first entry"


async def test_recent_rejects_invalid_limit(
    db_conn: aiosqlite.Connection,
) -> None:
    service = _progress(db_conn)
    with pytest.raises(ValueError, match="limit must be >= 1"):
        await service.recent(limit=0)


async def test_recent_handles_undecryptable_row(
    db_conn: aiosqlite.Connection,
) -> None:
    service = _progress(db_conn)
    # Insert a row whose encrypted_text is garbage.
    await db_conn.execute(
        "INSERT INTO progress_notes (date, encrypted_text, sentiment, score, summary) "
        "VALUES (?, ?, ?, ?, ?)",
        ("2026-04-24", "not-a-valid-token", None, None, None),
    )
    await db_conn.commit()
    rows = await service.recent()
    assert rows[0]["text"] == ""
    assert rows[0]["sentiment"] == "neutral"
    assert rows[0]["score"] == 0.0
