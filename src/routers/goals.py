from fastapi import APIRouter, Depends, HTTPException, status

from src.deps import get_goal_service
from src.schemas import GoalCreate, GoalStatusUpdate
from src.services.goals import GoalService


router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.get("")
async def list_goals(
    service: GoalService = Depends(get_goal_service),
) -> list[dict[str, object]]:
    return await service.list_goals()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_goal(
    payload: GoalCreate,
    service: GoalService = Depends(get_goal_service),
) -> dict[str, int]:
    new_id = await service.create(payload.title)
    return {"id": new_id}


@router.patch("/{goal_id}/status")
async def update_status(
    goal_id: int,
    payload: GoalStatusUpdate,
    service: GoalService = Depends(get_goal_service),
) -> dict[str, str]:
    try:
        await service.set_status(goal_id, payload.status.value)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"status": payload.status.value}


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    service: GoalService = Depends(get_goal_service),
) -> None:
    await service.delete(goal_id)


@router.post("/reprioritise")
async def reprioritise_goals(
    service: GoalService = Depends(get_goal_service),
) -> list[dict[str, object]]:
    return await service.recategorise_and_prioritise()
