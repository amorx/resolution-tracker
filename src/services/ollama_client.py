import json
from collections.abc import AsyncIterator
from typing import Any, Optional

import httpx

from src.config import ollama_model, ollama_url


class OllamaError(RuntimeError):
    """Raised when Ollama returns an unusable response."""


class OllamaClient:
    """Thin async wrapper around the Ollama HTTP API."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        client: Optional[httpx.AsyncClient] = None,
        timeout: float = 120.0,
    ) -> None:
        self._base_url = base_url or ollama_url()
        self._model = model or ollama_model()
        self._owns_client = client is None
        self._client = client or httpx.AsyncClient(
            base_url=self._base_url, timeout=timeout
        )

    @property
    def model(self) -> str:
        return self._model

    async def generate_json(
        self, prompt: str, system: Optional[str] = None
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }
        if system is not None:
            payload["system"] = system
        response = await self._client.post("/api/generate", json=payload)
        response.raise_for_status()
        data = response.json()
        raw = str(data.get("response", "{}"))
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as error:
            raise OllamaError("Ollama returned invalid JSON") from error
        if not isinstance(parsed, dict):
            raise OllamaError("Ollama JSON response was not an object")
        return parsed

    async def generate_text(
        self, prompt: str, system: Optional[str] = None
    ) -> str:
        payload: dict[str, Any] = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
        }
        if system is not None:
            payload["system"] = system
        response = await self._client.post("/api/generate", json=payload)
        response.raise_for_status()
        data = response.json()
        return str(data.get("response", ""))

    async def chat_stream(
        self, messages: list[dict[str, str]]
    ) -> AsyncIterator[str]:
        payload = {
            "model": self._model,
            "messages": messages,
            "stream": True,
        }
        async with self._client.stream(
            "POST", "/api/chat", json=payload
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    chunk = json.loads(line)
                except json.JSONDecodeError as error:
                    raise OllamaError("Ollama stream chunk was not JSON") from error
                content = str(chunk.get("message", {}).get("content", ""))
                if content:
                    yield content
                if chunk.get("done"):
                    break

    async def close(self) -> None:
        if self._owns_client:
            await self._client.aclose()
