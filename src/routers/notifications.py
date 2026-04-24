from fastapi import APIRouter, Depends, Query

from src.deps import get_notification_service
from src.services.notifications import NotificationService


router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    unread_only: bool = Query(False),
    service: NotificationService = Depends(get_notification_service),
) -> list[dict[str, object]]:
    return await service.list_all(unread_only=unread_only)


@router.get("/pending")
async def pending_notifications(
    service: NotificationService = Depends(get_notification_service),
) -> list[dict[str, object]]:
    return await service.pending()


@router.post("/{notif_id}/read")
async def mark_read(
    notif_id: int,
    service: NotificationService = Depends(get_notification_service),
) -> dict[str, str]:
    await service.mark_read(notif_id)
    return {"status": "ok"}
