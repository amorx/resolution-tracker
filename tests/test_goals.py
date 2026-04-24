import aiosqlite
import pytest

from src.services.goals import GoalService
from tests.conftest import FakeOllama


async def test_create_and_list(db_conn: aiosqlite.Connection) -> None:
    service = GoalService(db_conn, FakeOllama())
    await service.create("Run 5k three times a week")
    await service.create("Stretch every morning")
    goals = await service.list_goals()
    titles = [g["title"] for g in goals]
    assert "Run 5k three times a week" in titles
    assert "Stretch every morning" in titles


async def test_create_rejects_blank(db_conn: aiosqlite.Connection) -> None:
    service = GoalService(db_conn, FakeOllama())
    with pytest.raises(ValueError, match="required"):
        await service.create("    ")


async def test_set_status_updates_row(db_conn: aiosqlite.Connection) -> None:
    service = GoalService(db_conn, FakeOllama())
    new_id = await service.create("Drink more water")
    await service.set_status(new_id, "done")
    cursor = await db_conn.execute(
        "SELECT status FROM goals WHERE id = ?", (new_id,)
    )
    row = await cursor.fetchone()
    assert row["status"] == "done"


async def test_set_status_rejects_invalid(
    db_conn: aiosqlite.Connection,
) -> None:
    service = GoalService(db_conn, FakeOllama())
    new_id = await service.create("a goal")
    with pytest.raises(ValueError, match="Invalid status"):
        await service.set_status(new_id, "bogus")


async def test_delete_removes_row(db_conn: aiosqlite.Connection) -> None:
    service = GoalService(db_conn, FakeOllama())
    new_id = await service.create("temporary")
    await service.delete(new_id)
    assert await service.list_goals() == []


async def test_recategorise_empty_list_returns_empty(
    db_conn: aiosqlite.Connection,
) -> None:
    service = GoalService(db_conn, FakeOllama())
    assert await service.recategorise_and_prioritise() == []


async def test_recategorise_applies_llm_updates(
    db_conn: aiosqlite.Connection,
) -> None:
    fake = FakeOllama(
        json_response={
            "goals": [
                {
                    "id": 1,
                    "category": "strength",
                    "priority": 1,
                    "reason": "core lift"
                },
                {
                    "id": 2,
                    "category": "cardio",
                    "priority": 2,
                    "reason": "heart rate",
                },
                # Invalid entries are ignored.
                "garbage",
                {"id": 99, "category": "strength"},
                {"id": 3, "priority": 1},
                {"id": 3, "category": "nonsense", "priority": 1},
                {"id": 4, "category": "strength", "priority": "9"},
            ]
        }
    )
    service = GoalService(db_conn, fake)
    g1 = await service.create("Push-ups daily")
    g2 = await service.create("Run long")
    g4 = await service.create("Clamp priority too high")
    # Feed update for g4 with priority 9 which should clamp to 5.
    fake.json_response["goals"][-1]["id"] = g4
    # Correct ids for first two updates too.
    fake.json_response["goals"][0]["id"] = g1
    fake.json_response["goals"][1]["id"] = g2

    result = await service.recategorise_and_prioritise()
    by_id = {g["id"]: g for g in result}
    assert by_id[g1]["category"] == "strength"
    assert by_id[g1]["priority"] == 1
    assert by_id[g2]["category"] == "cardio"
    assert by_id[g4]["priority"] == 5


async def test_recategorise_requires_goals_list(
    db_conn: aiosqlite.Connection,
) -> None:
    fake = FakeOllama(json_response={"not_goals": []})
    service = GoalService(db_conn, fake)
    await service.create("anything")
    with pytest.raises(ValueError, match="missing 'goals' list"):
        await service.recategorise_and_prioritise()
