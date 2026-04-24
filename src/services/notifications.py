from datetime import datetime, timezone
from typing import Any, Optional

import aiosqlite


class NotificationService:
    """Outbox of reminder notifications pulled by the host notifier."""

    def __init__(self, conn: aiosqlite.Connection) -> None:
        self._conn = conn

    async def enqueue(
        self,
        kind: str,
        message: str,
        due_at: Optional[datetime] = None,
    ) -> int:
        cleaned_kind = kind.strip()
        cleaned_message = message.strip()
        if not cleaned_kind:
            raise ValueError("kind is required")
        if not cleaned_message:
            raise ValueError("message is required")
        target = (due_at or datetime.now(timezone.utc)).isoformat()
        cursor = await self._conn.execute(
            "INSERT INTO notifications (kind, message, due_at) VALUES (?, ?, ?)",
            (cleaned_kind, cleaned_message, target),
        )
        await self._conn.commit()
        new_id = cursor.lastrowid
        if new_id is None:  # pragma: no cover - SQLite always returns an id on success
            raise RuntimeError("Failed to insert notification row")
        return new_id

    async def list_all(self, unread_only: bool = False) -> list[dict[str, Any]]:
        if unread_only:
            sql = (
                "SELECT id, kind, message, due_at, read_at FROM notifications "
                "WHERE read_at IS NULL ORDER BY due_at DESC"
            )
        else:
            sql = (
                "SELECT id, kind, message, due_at, read_at FROM notifications "
                "ORDER BY due_at DESC"
            )
        cursor = await self._conn.execute(sql)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

    async def pending(self, now: Optional[datetime] = None) -> list[dict[str, Any]]:
        moment = (now or datetime.now(timezone.utc)).isoformat()
        cursor = await self._conn.execute(
            "SELECT id, kind, message, due_at FROM notifications "
            "WHERE read_at IS NULL AND due_at <= ? ORDER BY due_at ASC",
            (moment,),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

    async def mark_read(self, notif_id: int) -> None:
        await self._conn.execute(
            "UPDATE notifications SET read_at = datetime('now') WHERE id = ?",
            (notif_id,),
        )
        await self._conn.commit()
