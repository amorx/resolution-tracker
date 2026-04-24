from typing import Any, Final

import aiosqlite

from src.services.ollama_client import OllamaClient


VALID_STATUSES: Final[frozenset[str]] = frozenset({"active", "done", "archived"})
VALID_CATEGORIES: Final[frozenset[str]] = frozenset(
    {"strength", "cardio", "endurance", "flexibility", "wellbeing"}
)

PRIORITISE_SYSTEM_PROMPT: Final[str] = (
    "You are a supportive fitness coach. Categorise each goal as exactly one of "
    "'strength', 'cardio', 'endurance', 'flexibility', or 'wellbeing'. Assign a "
    "priority integer from 1 (highest) to 5 (lowest). Respond using the JSON schema "
    "you are given."
)


def _build_prioritise_prompt(goals: list[dict[str, Any]]) -> str:
    items = "\n".join(f"- id={g['id']}: {g['title']}" for g in goals)
    return (
        "Goals to categorise and prioritise:\n"
        f"{items}\n\n"
        'Return JSON in the form: {"goals":[{"id":<int>,'
        '"category":"strength|cardio|endurance|flexibility|wellbeing",'
        '"priority":<1-5>,"reason":"<=120 char rationale"}]}.'
    )


class GoalService:
    """Resolution goal CRUD plus LLM-backed categorisation."""

    def __init__(self, conn: aiosqlite.Connection, ollama: OllamaClient) -> None:
        self._conn = conn
        self._ollama = ollama

    async def create(self, title: str) -> int:
        cleaned = title.strip()
        if not cleaned:
            raise ValueError("title is required")
        cursor = await self._conn.execute(
            "INSERT INTO goals (title) VALUES (?)",
            (cleaned,),
        )
        await self._conn.commit()
        new_id = cursor.lastrowid
        if new_id is None:  # pragma: no cover - SQLite always returns an id on success
            raise RuntimeError("Failed to insert goal row")
        return new_id

    async def list_goals(self) -> list[dict[str, Any]]:
        cursor = await self._conn.execute(
            "SELECT id, title, category, priority, status, ai_reason "
            "FROM goals ORDER BY priority ASC, id ASC"
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

    async def set_status(self, goal_id: int, status: str) -> None:
        if status not in VALID_STATUSES:
            raise ValueError(f"Invalid status: {status}")
        await self._conn.execute(
            "UPDATE goals SET status = ?, updated_at = datetime('now') "
            "WHERE id = ?",
            (status, goal_id),
        )
        await self._conn.commit()

    async def delete(self, goal_id: int) -> None:
        await self._conn.execute("DELETE FROM goals WHERE id = ?", (goal_id,))
        await self._conn.commit()

    async def recategorise_and_prioritise(self) -> list[dict[str, Any]]:
        goals = await self.list_goals()
        if not goals:
            return []
        prompt = _build_prioritise_prompt(goals)
        data = await self._ollama.generate_json(
            prompt=prompt, system=PRIORITISE_SYSTEM_PROMPT
        )
        updates = data.get("goals")
        if not isinstance(updates, list):
            raise ValueError("LLM response missing 'goals' list")

        for update in updates:
            if not isinstance(update, dict):
                continue
            goal_id = update.get("id")
            category = update.get("category")
            priority = update.get("priority")
            reason = update.get("reason", "")
            if goal_id is None or priority is None:
                continue
            if category not in VALID_CATEGORIES:
                continue
            priority_int = max(1, min(5, int(priority)))
            await self._conn.execute(
                "UPDATE goals SET category = ?, priority = ?, ai_reason = ?, "
                "updated_at = datetime('now') WHERE id = ?",
                (category, priority_int, str(reason)[:240], int(goal_id)),
            )
        await self._conn.commit()
        return await self.list_goals()
