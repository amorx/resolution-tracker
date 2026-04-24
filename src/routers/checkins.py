from fastapi import APIRouter, Depends, status

from src.deps import get_progress_service, get_reminder_service
from src.schemas import ProgressNoteCreate
from src.services.progress import ProgressService
from src.services.reminders import ReminderService


router = APIRouter(prefix="/api/checkins", tags=["checkins"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_checkin(
    payload: ProgressNoteCreate,
    service: ProgressService = Depends(get_progress_service),
) -> dict[str, object]:
    return await service.record(payload.text)


@router.get("")
async def recent_checkins(
    service: ProgressService = Depends(get_progress_service),
) -> list[dict[str, object]]:
    return await service.recent()


@router.post("/prompt")
async def compose_prompt(
    reminders: ReminderService = Depends(get_reminder_service),
) -> dict[str, str]:
    message = await reminders.compose_checkin_message()
    return {"message": message}
