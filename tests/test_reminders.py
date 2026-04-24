from datetime import datetime, timezone

import aiosqlite

from src.services.activities import ActivityService
from src.services.goals import GoalService
from src.services.notifications import NotificationService
from src.services.reminders import ReminderService, _build_checkin_prompt
from tests.conftest import FakeOllama


async def test_compose_checkin_uses_llm(
    db_conn: aiosqlite.Connection,
) -> None:
    ollama = FakeOllama(text_response="Keep it up, try another set before bed.")
    service = ReminderService(
        ActivityService(db_conn),
        GoalService(db_conn, ollama),
        NotificationService(db_conn),
        ollama,
    )
    message = await service.compose_checkin_message(
        now=datetime(2026, 4, 24, 9, tzinfo=timezone.utc)
    )
    assert message == "Keep it up, try another set before bed."
    assert ("text", ollama.calls[0][1]) == ollama.calls[0]


async def test_compose_checkin_falls_back_on_blank(
    db_conn: aiosqlite.Connection,
) -> None:
    ollama = FakeOllama(text_response="   ")
    service = ReminderService(
        ActivityService(db_conn),
        GoalService(db_conn, ollama),
        NotificationService(db_conn),
        ollama,
    )
    message = await service.compose_checkin_message()
    assert message.startswith("Quick check-in")


async def test_run_checkin_enqueues_notification(
    db_conn: aiosqlite.Connection,
) -> None:
    ollama = FakeOllama(text_response="You crushed 20 pushups.")
    notifications = NotificationService(db_conn)
    service = ReminderService(
        ActivityService(db_conn),
        GoalService(db_conn, ollama),
        notifications,
        ollama,
    )
    notif_id = await service.run_checkin(
        now=datetime(2026, 4, 24, 18, tzinfo=timezone.utc)
    )
    all_rows = await notifications.list_all()
    assert len(all_rows) == 1
    assert all_rows[0]["id"] == notif_id
    assert all_rows[0]["message"] == "You crushed 20 pushups."


def test_build_checkin_prompt_renders_stats_and_goals() -> None:
    prompt = _build_checkin_prompt(
        {"pushups": 10, "squats": 0, "distance_m": 500, "situps": 0},
        [{"title": "Do mobility", "priority": 1}],
    )
    assert "pushups=10" in prompt
    assert "Do mobility" in prompt


def test_build_checkin_prompt_handles_no_goals() -> None:
    prompt = _build_checkin_prompt(
        {"pushups": 0, "squats": 0, "distance_m": 0, "situps": 0}, []
    )
    assert "(no active goals yet)" in prompt
