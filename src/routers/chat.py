from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from src.deps import get_ollama
from src.schemas import ChatRequest
from src.services.ollama_client import OllamaClient


router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
async def chat(
    payload: ChatRequest,
    ollama: OllamaClient = Depends(get_ollama),
) -> StreamingResponse:
    messages = [
        {"role": message.role, "content": message.content}
        for message in payload.messages
    ]

    async def iter_chunks() -> AsyncIterator[str]:
        async for chunk in ollama.chat_stream(messages):
            yield chunk

    return StreamingResponse(iter_chunks(), media_type="text/plain")
