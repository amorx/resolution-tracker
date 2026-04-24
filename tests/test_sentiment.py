import pytest

from src.services.sentiment import SentimentService
from tests.conftest import FakeOllama


async def test_analyse_returns_expected_fields() -> None:
    fake = FakeOllama(
        json_response={
            "sentiment": "positive",
            "score": 0.9,
            "summary": "User felt energised after workout",
        }
    )
    service = SentimentService(fake)
    result = await service.analyse("Smashed my pushups")
    assert result == {
        "sentiment": "positive",
        "score": 0.9,
        "summary": "User felt energised after workout",
    }


async def test_analyse_clamps_and_defaults() -> None:
    fake = FakeOllama(
        json_response={
            "sentiment": "ecstatic",
            "score": "not-a-number",
            "summary": "x" * 200,
        }
    )
    service = SentimentService(fake)
    result = await service.analyse("ok")
    assert result["sentiment"] == "neutral"
    assert result["score"] == 0.0
    assert len(result["summary"]) == 120


async def test_analyse_rejects_blank() -> None:
    fake = FakeOllama(json_response={})
    service = SentimentService(fake)
    with pytest.raises(ValueError, match="text is required"):
        await service.analyse("   ")


async def test_analyse_clamps_high_score() -> None:
    fake = FakeOllama(
        json_response={"sentiment": "positive", "score": 5, "summary": "ok"}
    )
    service = SentimentService(fake)
    result = await service.analyse("great")
    assert result["score"] == 1.0


async def test_analyse_clamps_low_score() -> None:
    fake = FakeOllama(
        json_response={"sentiment": "negative", "score": -9.9, "summary": "bad"}
    )
    service = SentimentService(fake)
    result = await service.analyse("bad")
    assert result["score"] == -1.0
