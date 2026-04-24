import pytest
from pydantic import ValidationError

from src.schemas import (
    ActivityCategory,
    ActivityEntryCreate,
    ChatMessage,
    ChatRequest,
    GoalCreate,
    GoalStatus,
    GoalStatusUpdate,
    ProgressNoteCreate,
    Sentiment,
)


def test_activity_entry_accepts_valid() -> None:
    entry = ActivityEntryCreate(category=ActivityCategory.PUSHUPS, count=20)
    assert entry.count == 20


def test_activity_entry_rejects_negative() -> None:
    with pytest.raises(ValidationError):
        ActivityEntryCreate(category=ActivityCategory.PUSHUPS, count=-1)


def test_activity_entry_rejects_unknown_category() -> None:
    with pytest.raises(ValidationError):
        ActivityEntryCreate(category="dance", count=1)  # type: ignore[arg-type]


def test_goal_create_strips_whitespace() -> None:
    goal = GoalCreate(title="  run 5k  ")
    assert goal.title == "run 5k"


def test_goal_create_rejects_blank() -> None:
    with pytest.raises(ValidationError):
        GoalCreate(title="    ")


def test_goal_create_rejects_too_short() -> None:
    with pytest.raises(ValidationError):
        GoalCreate(title="ab")


def test_goal_status_update_accepts_enum() -> None:
    update = GoalStatusUpdate(status=GoalStatus.DONE)
    assert update.status is GoalStatus.DONE


def test_progress_note_strips_and_requires_text() -> None:
    note = ProgressNoteCreate(text="  felt great today  ")
    assert note.text == "felt great today"
    with pytest.raises(ValidationError):
        ProgressNoteCreate(text="   ")


def test_chat_request_requires_at_least_one_message() -> None:
    with pytest.raises(ValidationError):
        ChatRequest(messages=[])


def test_chat_message_accepts_roles() -> None:
    msg = ChatMessage(role="user", content="hi")
    assert msg.role == "user"
    with pytest.raises(ValidationError):
        ChatMessage(role="bot", content="hi")


def test_sentiment_enum_values() -> None:
    assert Sentiment.POSITIVE.value == "positive"
    assert Sentiment.NEUTRAL.value == "neutral"
    assert Sentiment.NEGATIVE.value == "negative"
