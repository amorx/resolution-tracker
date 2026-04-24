from collections.abc import AsyncIterator
from typing import Any

import aiosqlite
import pytest
import pytest_asyncio
from cryptography.fernet import Fernet

from src.db import SCHEMA


@pytest.fixture(autouse=True)
def encryption_key(monkeypatch: pytest.MonkeyPatch) -> str:
    key = Fernet.generate_key().decode("utf-8")
    monkeypatch.setenv("ENCRYPTION_KEY", key)
    return key


@pytest.fixture(autouse=True)
def isolated_db_path(tmp_path: Any, monkeypatch: pytest.MonkeyPatch) -> str:
    path = str(tmp_path / "test.db")
    monkeypatch.setenv("DB_PATH", path)
    return path


@pytest_asyncio.fixture
async def db_conn(isolated_db_path: str) -> AsyncIterator[aiosqlite.Connection]:
    conn = await aiosqlite.connect(isolated_db_path)
    conn.row_factory = aiosqlite.Row
    try:
        await conn.executescript(SCHEMA)
        await conn.commit()
        yield conn
    finally:
        await conn.close()


class FakeOllama:
    """Test double for OllamaClient used across tests."""

    def __init__(
        self,
        json_response: dict[str, Any] | None = None,
        text_response: str = "",
        stream_chunks: list[str] | None = None,
    ) -> None:
        self.json_response: dict[str, Any] = (
            dict(json_response) if json_response is not None else {}
        )
        self.text_response = text_response
        self.stream_chunks = list(stream_chunks) if stream_chunks else []
        self.calls: list[tuple[str, str | None]] = []

    @property
    def model(self) -> str:
        return "test-model"

    async def generate_json(
        self, prompt: str, system: str | None = None
    ) -> dict[str, Any]:
        self.calls.append(("json", system))
        return dict(self.json_response)

    async def generate_text(
        self, prompt: str, system: str | None = None
    ) -> str:
        self.calls.append(("text", system))
        return self.text_response

    async def chat_stream(
        self, messages: list[dict[str, str]]
    ) -> AsyncIterator[str]:
        self.calls.append(("chat", None))
        for chunk in self.stream_chunks:
            yield chunk

    async def close(self) -> None:
        self.calls.append(("close", None))


@pytest.fixture
def fake_ollama() -> FakeOllama:
    return FakeOllama()
