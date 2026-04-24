from typing import Final

from src.services.ollama_client import OllamaClient


ALLOWED_SENTIMENTS: Final[frozenset[str]] = frozenset(
    {"positive", "neutral", "negative"}
)

SENTIMENT_SYSTEM_PROMPT: Final[str] = (
    "You perform sentiment analysis on short fitness progress notes. "
    "Return JSON with keys: sentiment (positive|neutral|negative), "
    "score (float between -1 and 1 where -1 is very negative), "
    "summary (<= 120 character neutral paraphrase)."
)


class SentimentService:
    """Sentiment analysis delegated to the local LLM."""

    def __init__(self, ollama: OllamaClient) -> None:
        self._ollama = ollama

    async def analyse(self, text: str) -> dict[str, object]:
        cleaned = text.strip()
        if not cleaned:
            raise ValueError("text is required for sentiment analysis")
        data = await self._ollama.generate_json(
            prompt=f"Analyse this progress note:\n\n{cleaned}",
            system=SENTIMENT_SYSTEM_PROMPT,
        )

        sentiment = str(data.get("sentiment", "neutral")).lower()
        if sentiment not in ALLOWED_SENTIMENTS:
            sentiment = "neutral"

        score_raw = data.get("score", 0)
        try:
            score = float(score_raw)
        except (TypeError, ValueError):
            score = 0.0
        score = max(-1.0, min(1.0, score))

        summary = str(data.get("summary", ""))[:120]

        return {"sentiment": sentiment, "score": score, "summary": summary}
