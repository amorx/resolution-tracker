from datetime import datetime, timezone
from typing import Any, Final, Optional

from src.services.activities import ActivityService
from src.services.goals import GoalService
from src.services.notifications import NotificationService
from src.services.ollama_client import OllamaClient


REMINDER_SYSTEM_PROMPT: Final[str] = (
    "You are a supportive fitness coach. Write a short check-in (<= 2 sentences). "
    "Reference today's progress honestly and nudge on one concrete next step. "
    "Warm tone, no emoji, no preamble."
)

DEFAULT_FALLBACK: Final[str] = "Quick check-in: how are your resolutions tracking today?"


def _build_checkin_prompt(
    totals: dict[str, int], goals: list[dict[str, Any]]
) -> str:
    stats_line = ", ".join(f"{k}={v}" for k, v in sorted(totals.items()))
    if goals:
        goal_lines = "\n".join(
            f"- [priority {g['priority']}] {g['title']}" for g in goals
        )
    else:
        goal_lines = "(no active goals yet)"
    return (
        f"Today's totals: {stats_line}.\n"
        f"Active goals:\n{goal_lines}\n\n"
        "Write the check-in now."
    )


class ReminderService:
    """Composes LLM-authored reminders and enqueues them for delivery."""

    def __init__(
        self,
        activities: ActivityService,
        goals: GoalService,
        notifications: NotificationService,
        ollama: OllamaClient,
    ) -> None:
        self._activities = activities
        self._goals = goals
        self._notifications = notifications
        self._ollama = ollama

    async def compose_checkin_message(
        self, now: Optional[datetime] = None
    ) -> str:
        moment = now or datetime.now(timezone.utc)
        totals = await self._activities.totals_for_date(
            moment.date().isoformat()
        )
        goals = await self._goals.list_goals()
        prompt = _build_checkin_prompt(totals, goals)
        message = await self._ollama.generate_text(
            prompt=prompt, system=REMINDER_SYSTEM_PROMPT
        )
        stripped = message.strip()
        return stripped or DEFAULT_FALLBACK

    async def run_checkin(self, now: Optional[datetime] = None) -> int:
        message = await self.compose_checkin_message(now)
        return await self._notifications.enqueue("checkin", message)
