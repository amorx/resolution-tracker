from datetime import datetime, timedelta, timezone

import aiosqlite
import pytest

from src.services.notifications import NotificationService


async def test_enqueue_and_list(db_conn: aiosqlite.Connection) -> None:
    service = NotificationService(db_conn)
    first = await service.enqueue("checkin", "Time to train")
    second = await service.enqueue(
        "goal", "Don't forget water", due_at=datetime(2026, 4, 24, 12, tzinfo=timezone.utc)
    )
    all_rows = await service.list_all()
    assert {row["id"] for row in all_rows} == {first, second}


async def test_enqueue_rejects_blanks(db_conn: aiosqlite.Connection) -> None:
    service = NotificationService(db_conn)
    with pytest.raises(ValueError, match="kind is required"):
        await service.enqueue("  ", "hello")
    with pytest.raises(ValueError, match="message is required"):
        await service.enqueue("checkin", "   ")


async def test_list_all_unread_only_filters_read(
    db_conn: aiosqlite.Connection,
) -> None:
    service = NotificationService(db_conn)
    a = await service.enqueue("checkin", "one")
    await service.enqueue("checkin", "two")
    await service.mark_read(a)
    unread = await service.list_all(unread_only=True)
    assert len(unread) == 1
    assert unread[0]["kind"] == "checkin"


async def test_pending_filters_by_time_and_read_state(
    db_conn: aiosqlite.Connection,
) -> None:
    service = NotificationService(db_conn)
    past = datetime(2020, 1, 1, tzinfo=timezone.utc)
    future = datetime.now(timezone.utc) + timedelta(days=1)
    past_id = await service.enqueue("checkin", "due now", due_at=past)
    await service.enqueue("checkin", "due later", due_at=future)
    pending = await service.pending()
    assert len(pending) == 1
    assert pending[0]["id"] == past_id

    await service.mark_read(past_id)
    assert await service.pending() == []


async def test_pending_accepts_custom_now(
    db_conn: aiosqlite.Connection,
) -> None:
    service = NotificationService(db_conn)
    due = datetime(2026, 4, 24, 10, tzinfo=timezone.utc)
    await service.enqueue("checkin", "anchor", due_at=due)
    pending = await service.pending(now=datetime(2026, 4, 24, 9, tzinfo=timezone.utc))
    assert pending == []
    pending = await service.pending(now=datetime(2026, 4, 24, 11, tzinfo=timezone.utc))
    assert len(pending) == 1
