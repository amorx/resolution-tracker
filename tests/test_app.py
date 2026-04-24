from collections.abc import AsyncIterator

import aiosqlite
import pytest
import pytest_asyncio
from cryptography.fernet import Fernet
from fastapi.testclient import TestClient

from src.app import app, validate_goal_payload
from src.db import SCHEMA
from src.deps import get_crypto, get_db, get_ollama
from src.services.crypto import CryptoService
from src.services.notifications import NotificationService
from tests.conftest import FakeOllama


@pytest_asyncio.fixture
async def _prepared_db(isolated_db_path: str) -> AsyncIterator[str]:
    conn = await aiosqlite.connect(isolated_db_path)
    try:
        await conn.executescript(SCHEMA)
        await conn.commit()
    finally:
        await conn.close()
    yield isolated_db_path


@pytest.fixture
def test_client(
    _prepared_db: str, encryption_key: str
) -> TestClient:
    fake = FakeOllama()

    async def override_db() -> AsyncIterator[aiosqlite.Connection]:
        conn = await aiosqlite.connect(_prepared_db)
        conn.row_factory = aiosqlite.Row
        try:
            yield conn
        finally:
            await conn.close()

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_ollama] = lambda: fake
    app.dependency_overrides[get_crypto] = lambda: CryptoService(key=encryption_key)

    with TestClient(app) as client:
        client.fake_ollama = fake  # type: ignore[attr-defined]
        client.db_path = _prepared_db  # type: ignore[attr-defined]
        yield client

    app.dependency_overrides.clear()


async def _seed_notification(db_path: str, message: str = "hello") -> int:
    conn = await aiosqlite.connect(db_path)
    conn.row_factory = aiosqlite.Row
    try:
        service = NotificationService(conn)
        return await service.enqueue("checkin", message)
    finally:
        await conn.close()


def test_read_root_status(test_client: TestClient) -> None:
    response = test_client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "status": "Resolution Tracker Online",
        "version": "1.0.0",
    }


def test_health_endpoint(test_client: TestClient) -> None:
    response = test_client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_not_found_handler_includes_security_headers(
    test_client: TestClient,
) -> None:
    response = test_client.get("/does-not-exist")
    assert response.status_code == 404
    assert response.json() == {"detail": "Not Found"}
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Cross-Origin-Resource-Policy"] == "same-origin"


def test_robots_and_sitemap(test_client: TestClient) -> None:
    robots = test_client.get("/robots.txt")
    assert robots.status_code == 200
    assert "User-agent" in robots.text
    assert robots.headers["content-type"].startswith("text/plain")
    sitemap = test_client.get("/sitemap.xml")
    assert sitemap.status_code == 200
    assert sitemap.text.startswith("<?xml")
    assert sitemap.headers["content-type"].startswith("application/xml")


def test_validate_goal_payload_happy_path() -> None:
    assert validate_goal_payload({"title": "Exercise daily"}) is True


def test_validate_goal_payload_rejects_invalid() -> None:
    assert validate_goal_payload({"title": "x"}) is False
    assert validate_goal_payload({"title": "  "}) is False


def test_create_activity_endpoint(test_client: TestClient) -> None:
    response = test_client.post(
        "/api/activities",
        json={"category": "pushups", "count": 20},
    )
    assert response.status_code == 201, response.text


def test_create_activity_rejects_bad_category(test_client: TestClient) -> None:
    response = test_client.post(
        "/api/activities", json={"category": "dance", "count": 1}
    )
    assert response.status_code == 422


def test_create_activity_rejects_negative_at_service_boundary(
    test_client: TestClient,
) -> None:
    response = test_client.post(
        "/api/activities",
        json={"category": "pushups", "count": -5},
    )
    # Pydantic catches negatives at the schema layer (ge=0).
    assert response.status_code == 422


def test_create_activity_service_error_maps_to_400(
    test_client: TestClient,
) -> None:
    """Exercise the defensive HTTPException branch when the service raises."""
    from src.deps import get_activity_service

    class BoomService:
        async def add_entry(self, *_: object, **__: object) -> int:
            raise ValueError("bad cat")

    app.dependency_overrides[get_activity_service] = lambda: BoomService()
    try:
        response = test_client.post(
            "/api/activities",
            json={"category": "pushups", "count": 1},
        )
    finally:
        app.dependency_overrides.pop(get_activity_service, None)
    assert response.status_code == 400
    assert response.json()["detail"] == "bad cat"


def test_goals_status_service_error_maps_to_400(
    test_client: TestClient,
) -> None:
    from src.deps import get_goal_service

    class BoomGoalService:
        async def set_status(self, *_: object, **__: object) -> None:
            raise ValueError("bad status")

    app.dependency_overrides[get_goal_service] = lambda: BoomGoalService()
    try:
        response = test_client.patch(
            "/api/goals/1/status", json={"status": "active"}
        )
    finally:
        app.dependency_overrides.pop(get_goal_service, None)
    assert response.status_code == 400
    assert response.json()["detail"] == "bad status"


def test_activities_today_returns_totals(test_client: TestClient) -> None:
    test_client.post(
        "/api/activities", json={"category": "pushups", "count": 10}
    )
    test_client.post(
        "/api/activities", json={"category": "squats", "count": 15}
    )
    response = test_client.get("/api/activities/today")
    assert response.status_code == 200
    data = response.json()
    assert data["pushups"] == 10
    assert data["squats"] == 15


def test_activities_series(test_client: TestClient) -> None:
    test_client.post(
        "/api/activities", json={"category": "pushups", "count": 5}
    )
    response = test_client.get("/api/activities/series?days=3")
    assert response.status_code == 200
    assert len(response.json()) == 3


def test_activity_add_with_past_date(test_client: TestClient) -> None:
    response = test_client.post(
        "/api/activities",
        json={
            "category": "situps",
            "count": 12,
            "entry_date": "2026-04-23",
        },
    )
    assert response.status_code == 201
    assert response.json()["date"] == "2026-04-23"


def test_goals_flow(test_client: TestClient) -> None:
    create = test_client.post("/api/goals", json={"title": "Run 5k"})
    assert create.status_code == 201
    goal_id = create.json()["id"]

    listed = test_client.get("/api/goals")
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    patch = test_client.patch(
        f"/api/goals/{goal_id}/status", json={"status": "done"}
    )
    assert patch.status_code == 200
    assert patch.json()["status"] == "done"

    delete = test_client.delete(f"/api/goals/{goal_id}")
    assert delete.status_code == 204


def test_goals_reprioritise_uses_llm(test_client: TestClient) -> None:
    create = test_client.post("/api/goals", json={"title": "Core strength"})
    goal_id = create.json()["id"]
    test_client.fake_ollama.json_response = {  # type: ignore[attr-defined]
        "goals": [
            {
                "id": goal_id,
                "category": "strength",
                "priority": 2,
                "reason": "foundation",
            }
        ]
    }
    response = test_client.post("/api/goals/reprioritise")
    assert response.status_code == 200
    goals = response.json()
    assert goals[0]["category"] == "strength"
    assert goals[0]["priority"] == 2


def test_checkin_create_and_list(test_client: TestClient) -> None:
    test_client.fake_ollama.json_response = {  # type: ignore[attr-defined]
        "sentiment": "positive",
        "score": 0.5,
        "summary": "Feeling motivated",
    }
    create = test_client.post(
        "/api/checkins", json={"text": "Feeling good today!"}
    )
    assert create.status_code == 201
    body = create.json()
    assert body["sentiment"] == "positive"

    listed = test_client.get("/api/checkins")
    assert listed.status_code == 200
    assert listed.json()[0]["text"] == "Feeling good today!"


def test_checkin_prompt_endpoint(test_client: TestClient) -> None:
    test_client.fake_ollama.text_response = "Try a quick plank."  # type: ignore[attr-defined]
    response = test_client.post("/api/checkins/prompt")
    assert response.status_code == 200
    assert response.json() == {"message": "Try a quick plank."}


def test_notifications_list_unread_and_pending(
    test_client: TestClient,
) -> None:
    import asyncio

    notif_id = asyncio.run(_seed_notification(test_client.db_path, "hello"))  # type: ignore[attr-defined]

    listed = test_client.get("/api/notifications")
    assert listed.status_code == 200
    assert any(item["id"] == notif_id for item in listed.json())

    pending = test_client.get("/api/notifications/pending")
    assert pending.status_code == 200
    assert any(item["id"] == notif_id for item in pending.json())

    unread = test_client.get("/api/notifications?unread_only=true")
    assert unread.status_code == 200
    assert any(item["id"] == notif_id for item in unread.json())

    mark = test_client.post(f"/api/notifications/{notif_id}/read")
    assert mark.status_code == 200

    unread_after = test_client.get("/api/notifications?unread_only=true")
    assert all(item["id"] != notif_id for item in unread_after.json())


def test_chat_streams_chunks(test_client: TestClient) -> None:
    test_client.fake_ollama.stream_chunks = ["Hello", " there"]  # type: ignore[attr-defined]
    response = test_client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "hi"}]},
    )
    assert response.status_code == 200
    assert response.text == "Hello there"


def test_fernet_key_still_generatable() -> None:
    # Guard against crypto regression; cheap smoke check.
    assert Fernet.generate_key()
