from datetime import date, timedelta
from typing import Final, Optional

import aiosqlite


VALID_CATEGORIES: Final[frozenset[str]] = frozenset(
    {"pushups", "distance_m", "squats", "situps"}
)


class ActivityService:
    """Persistence layer for daily activity tallies."""

    def __init__(self, conn: aiosqlite.Connection) -> None:
        self._conn = conn

    async def add_entry(
        self,
        category: str,
        count: int,
        entry_date: Optional[str] = None,
    ) -> int:
        if category not in VALID_CATEGORIES:
            raise ValueError(f"Unknown category: {category}")
        if count < 0:
            raise ValueError("count must be non-negative")
        target = entry_date or date.today().isoformat()
        cursor = await self._conn.execute(
            "INSERT INTO activities (date, category, count) VALUES (?, ?, ?)",
            (target, category, count),
        )
        await self._conn.commit()
        new_id = cursor.lastrowid
        if new_id is None:  # pragma: no cover - SQLite always returns an id on success
            raise RuntimeError("Failed to insert activity row")
        return new_id

    async def totals_for_date(self, target_date: str) -> dict[str, int]:
        cursor = await self._conn.execute(
            "SELECT category, SUM(count) AS total FROM activities "
            "WHERE date = ? GROUP BY category",
            (target_date,),
        )
        rows = await cursor.fetchall()
        totals = {category: 0 for category in VALID_CATEGORIES}
        for row in rows:
            totals[row["category"]] = int(row["total"] or 0)
        return totals

    async def rolling_series(self, days: int = 7) -> list[dict[str, object]]:
        if days < 1:
            raise ValueError("days must be >= 1")
        end = date.today()
        start = end - timedelta(days=days - 1)
        cursor = await self._conn.execute(
            "SELECT date, category, SUM(count) AS total FROM activities "
            "WHERE date >= ? AND date <= ? "
            "GROUP BY date, category ORDER BY date",
            (start.isoformat(), end.isoformat()),
        )
        rows = await cursor.fetchall()
        series: dict[str, dict[str, int]] = {}
        for offset in range(days):
            day = (start + timedelta(days=offset)).isoformat()
            series[day] = {category: 0 for category in VALID_CATEGORIES}
        for row in rows:
            series[row["date"]][row["category"]] = int(row["total"] or 0)
        return [{"date": day, **counts} for day, counts in series.items()]
