import json
from collections.abc import AsyncIterator

import httpx
import pytest
import respx

from src.services.ollama_client import OllamaClient, OllamaError


@pytest.fixture
def client() -> OllamaClient:
    return OllamaClient(base_url="http://ollama.test", model="test-model")


async def test_generate_json_parses_response(client: OllamaClient) -> None:
    async with respx.mock(base_url="http://ollama.test") as mock:
        mock.post("/api/generate").mock(
            return_value=httpx.Response(
                200, json={"response": json.dumps({"hello": "world"})}
            )
        )
        result = await client.generate_json("hi", system="be nice")
    assert result == {"hello": "world"}
    await client.close()


async def test_generate_json_raises_on_bad_json(client: OllamaClient) -> None:
    async with respx.mock(base_url="http://ollama.test") as mock:
        mock.post("/api/generate").mock(
            return_value=httpx.Response(200, json={"response": "not json"})
        )
        with pytest.raises(OllamaError, match="invalid JSON"):
            await client.generate_json("hi")
    await client.close()


async def test_generate_json_raises_on_non_object(client: OllamaClient) -> None:
    async with respx.mock(base_url="http://ollama.test") as mock:
        mock.post("/api/generate").mock(
            return_value=httpx.Response(
                200, json={"response": json.dumps([1, 2, 3])}
            )
        )
        with pytest.raises(OllamaError, match="not an object"):
            await client.generate_json("hi")
    await client.close()


async def test_generate_text_returns_response(client: OllamaClient) -> None:
    async with respx.mock(base_url="http://ollama.test") as mock:
        mock.post("/api/generate").mock(
            return_value=httpx.Response(200, json={"response": "hello"})
        )
        text = await client.generate_text("hi", system="ctx")
    assert text == "hello"
    await client.close()


async def test_chat_stream_yields_content_chunks(client: OllamaClient) -> None:
    body = "\n".join(
        [
            json.dumps({"message": {"content": "Hello"}, "done": False}),
            json.dumps({"message": {"content": " world"}, "done": False}),
            "",
            json.dumps({"message": {"content": ""}, "done": True}),
        ]
    )
    async with respx.mock(base_url="http://ollama.test") as mock:
        mock.post("/api/chat").mock(
            return_value=httpx.Response(
                200, text=body, headers={"content-type": "application/x-ndjson"}
            )
        )
        chunks: list[str] = []
        async for piece in client.chat_stream(
            [{"role": "user", "content": "hi"}]
        ):
            chunks.append(piece)
    assert chunks == ["Hello", " world"]
    await client.close()


async def test_chat_stream_raises_on_bad_chunk(client: OllamaClient) -> None:
    async with respx.mock(base_url="http://ollama.test") as mock:
        mock.post("/api/chat").mock(
            return_value=httpx.Response(
                200, text="not-json-line\n", headers={"content-type": "application/x-ndjson"}
            )
        )
        aiter: AsyncIterator[str] = client.chat_stream(
            [{"role": "user", "content": "hi"}]
        )
        with pytest.raises(OllamaError, match="not JSON"):
            async for _ in aiter:  # pragma: no branch
                pass  # pragma: no cover
    await client.close()


async def test_chat_stream_stops_at_done_without_content(client: OllamaClient) -> None:
    body = "\n".join(
        [
            json.dumps({"message": {"content": "only"}, "done": False}),
            json.dumps({"done": True}),
        ]
    )
    async with respx.mock(base_url="http://ollama.test") as mock:
        mock.post("/api/chat").mock(
            return_value=httpx.Response(
                200, text=body, headers={"content-type": "application/x-ndjson"}
            )
        )
        chunks = [
            piece
            async for piece in client.chat_stream(
                [{"role": "user", "content": "hi"}]
            )
        ]
    assert chunks == ["only"]
    await client.close()


async def test_uses_injected_client_and_does_not_close_it() -> None:
    async with httpx.AsyncClient(base_url="http://ollama.test") as injected:
        client = OllamaClient(client=injected, model="injected-model")
        assert client.model == "injected-model"
        await client.close()  # should NOT close injected client
        assert not injected.is_closed


async def test_defaults_use_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OLLAMA_URL", "http://env:9999")
    monkeypatch.setenv("OLLAMA_MODEL", "env-model")
    client = OllamaClient()
    try:
        assert client.model == "env-model"
    finally:
        await client.close()
