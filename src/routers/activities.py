from datetime import date as dt_date

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.deps import get_activity_service
from src.schemas import ActivityEntryCreate, DailyTotals
from src.services.activities import ActivityService


router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_activity(
    payload: ActivityEntryCreate,
    service: ActivityService = Depends(get_activity_service),
) -> dict[str, int | str]:
    target = (payload.entry_date or dt_date.today()).isoformat()
    try:
        new_id = await service.add_entry(
            payload.category.value, payload.count, target
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"id": new_id, "date": target}


@router.get("/today", response_model=DailyTotals)
async def totals_today(
    service: ActivityService = Depends(get_activity_service),
) -> DailyTotals:
    today = dt_date.today().isoformat()
    totals = await service.totals_for_date(today)
    return DailyTotals(date=today, **totals)


@router.get("/series")
async def rolling_series(
    days: int = Query(7, ge=1, le=90),
    service: ActivityService = Depends(get_activity_service),
) -> list[dict[str, object]]:
    return await service.rolling_series(days)
