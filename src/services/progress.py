from datetime import date as dt_date
from typing import Any, Optional

import aiosqlite

from src.services.crypto import CryptoService
from src.services.sentiment import SentimentService


class ProgressService:
    """Persists encrypted progress notes with LLM sentiment metadata."""

    def __init__(
        self,
        conn: aiosqlite.Connection,
        crypto: CryptoService,
        sentiment: SentimentService,
    ) -> None:
        self._conn = conn
        self._crypto = crypto
        self._sentiment = sentiment

    async def record(
        self, text: str, entry_date: Optional[str] = None
    ) -> dict[str, Any]:
        cleaned = text.strip()
        if not cleaned:
            raise ValueError("text is required")
        analysis = await self._sentiment.analyse(cleaned)
        encrypted = self._crypto.encrypt(cleaned)
        target_date = entry_date or dt_date.today().isoformat()
        cursor = await self._conn.execute(
            "INSERT INTO progress_notes "
            "(date, encrypted_text, sentiment, score, summary) "
            "VALUES (?, ?, ?, ?, ?)",
            (
                target_date,
                encrypted,
                str(analysis["sentiment"]),
                float(analysis["score"]),
                str(analysis["summary"]),
            ),
        )
        await self._conn.commit()
        new_id = cursor.lastrowid
        if new_id is None:  # pragma: no cover - SQLite always returns an id on success
            raise RuntimeError("Failed to insert progress note row")
        return {
            "id": new_id,
            "date": target_date,
            "text": cleaned,
            "sentiment": analysis["sentiment"],
            "score": analysis["score"],
            "summary": analysis["summary"],
        }

    async def recent(self, limit: int = 20) -> list[dict[str, Any]]:
        if limit < 1:
            raise ValueError("limit must be >= 1")
        cursor = await self._conn.execute(
            "SELECT id, date, encrypted_text, sentiment, score, summary "
            "FROM progress_notes ORDER BY id DESC LIMIT ?",
            (int(limit),),
        )
        rows = await cursor.fetchall()
        results: list[dict[str, Any]] = []
        for row in rows:
            try:
                text = self._crypto.decrypt(row["encrypted_text"])
            except ValueError:
                text = ""
            results.append(
                {
                    "id": row["id"],
                    "date": row["date"],
                    "text": text,
                    "sentiment": row["sentiment"] or "neutral",
                    "score": float(row["score"] or 0.0),
                    "summary": row["summary"] or "",
                }
            )
        return results
