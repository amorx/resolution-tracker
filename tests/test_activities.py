from datetime import date, timedelta

import aiosqlite
import pytest
from freezegun import freeze_time

from src.services.activities import ActivityService


async def test_add_entry_uses_today_when_no_date(
    db_conn: aiosqlite.Connection,
) -> None:
    service = ActivityService(db_conn)
    with freeze_time("2026-04-24"):
        new_id = await service.add_entry("pushups", 25)
    cursor = await db_conn.execute(
        "SELECT date, category, count FROM activities WHERE id = ?", (new_id,)
    )
    row = await cursor.fetchone()
    assert row["date"] == "2026-04-24"
    assert row["category"] == "pushups"
    assert row["count"] == 25


async def test_add_entry_rejects_unknown_category(
    db_conn: aiosqlite.Connection,
) -> None:
    service = ActivityService(db_conn)
    with pytest.raises(ValueError, match="Unknown category"):
        await service.add_entry("dance", 5)


async def test_add_entry_rejects_negative_count(
    db_conn: aiosqlite.Connection,
) -> None:
    service = ActivityService(db_conn)
    with pytest.raises(ValueError, match="non-negative"):
        await service.add_entry("pushups", -1)


async def test_totals_for_date_aggregates(
    db_conn: aiosqlite.Connection,
) -> None:
    service = ActivityService(db_conn)
    await service.add_entry("pushups", 10, "2026-04-24")
    await service.add_entry("pushups", 15, "2026-04-24")
    await service.add_entry("squats", 20, "2026-04-24")
    totals = await service.totals_for_date("2026-04-24")
    assert totals["pushups"] == 25
    assert totals["squats"] == 20
    assert totals["situps"] == 0
    assert totals["distance_m"] == 0


async def test_totals_for_date_with_no_entries(
    db_conn: aiosqlite.Connection,
) -> None:
    service = ActivityService(db_conn)
    totals = await service.totals_for_date("2026-01-01")
    assert totals == {
        "pushups": 0,
        "distance_m": 0,
        "squats": 0,
        "situps": 0,
    }


async def test_rolling_series_returns_contiguous_days(
    db_conn: aiosqlite.Connection,
) -> None:
    service = ActivityService(db_conn)
    with freeze_time("2026-04-24"):
        await service.add_entry("pushups", 12)
        await service.add_entry("squats", 4)
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        await service.add_entry("pushups", 8, yesterday)
        series = await service.rolling_series(3)
    assert [row["date"] for row in series] == [
        (date(2026, 4, 22)).isoformat(),
        (date(2026, 4, 23)).isoformat(),
        (date(2026, 4, 24)).isoformat(),
    ]
    totals_today = next(row for row in series if row["date"] == "2026-04-24")
    assert totals_today["pushups"] == 12
    assert totals_today["squats"] == 4


async def test_rolling_series_rejects_invalid_days(
    db_conn: aiosqlite.Connection,
) -> None:
    service = ActivityService(db_conn)
    with pytest.raises(ValueError, match="days must be >= 1"):
        await service.rolling_series(0)
