from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ActivityCategory(str, Enum):
    PUSHUPS = "pushups"
    DISTANCE_M = "distance_m"
    SQUATS = "squats"
    SITUPS = "situps"


class GoalStatus(str, Enum):
    ACTIVE = "active"
    DONE = "done"
    ARCHIVED = "archived"


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class ActivityEntryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: ActivityCategory
    count: int = Field(..., ge=0, le=1_000_000)
    entry_date: Optional[date] = None


class ActivityEntry(BaseModel):
    id: int
    date: str
    category: ActivityCategory
    count: int


class DailyTotals(BaseModel):
    date: str
    pushups: int = 0
    distance_m: int = 0
    squats: int = 0
    situps: int = 0


class GoalCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=3, max_length=120)

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("title cannot be blank")
        return cleaned


class GoalStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: GoalStatus


class Goal(BaseModel):
    id: int
    title: str
    category: Optional[str] = None
    priority: int = Field(3, ge=1, le=5)
    status: GoalStatus = GoalStatus.ACTIVE
    ai_reason: Optional[str] = None


class ProgressNoteCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(..., min_length=1, max_length=4000)

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("text cannot be blank")
        return cleaned


class ProgressNote(BaseModel):
    id: int
    date: str
    text: str
    sentiment: Sentiment
    score: float = Field(..., ge=-1.0, le=1.0)
    summary: str = ""


class Notification(BaseModel):
    id: int
    kind: str
    message: str
    due_at: datetime
    read_at: Optional[datetime] = None


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    messages: list[ChatMessage] = Field(..., min_length=1, max_length=32)
