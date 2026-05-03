from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, get_redis_client
from app.core.redis import RedisClient
from app.models.user import User
from app.schemas.workout import WorkoutCreate, WorkoutResponse, WorkoutUpdate
from app.services.log_service import LogService

router = APIRouter(prefix="/workouts", tags=["workouts"])


def get_log_service(
    db: AsyncSession = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client),
) -> LogService:
    return LogService(db=db, redis=redis)


@router.post("", response_model=WorkoutResponse, status_code=201)
async def create_workout(
    request: WorkoutCreate,
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Add a workout entry."""
    workout = await log_service.add_workout(
        user_id=current_user.id,
        daily_log_id=request.daily_log_id,
        exercise_type=request.exercise_type,
        duration_min=request.duration_min,
        intensity=request.intensity,
        calories_burned=request.calories_burned,
        notes=request.notes,
    )
    return WorkoutResponse(
        id=workout.id,
        daily_log_id=workout.daily_log_id,
        user_id=workout.user_id,
        exercise_type=workout.exercise_type,
        duration_min=workout.duration_min,
        intensity=workout.intensity,
        calories_burned=workout.calories_burned,
        notes=workout.notes,
        created_at=workout.created_at,
    )


@router.put("/{workout_id}", response_model=WorkoutResponse)
async def update_workout(
    workout_id: UUID,
    request: WorkoutUpdate,
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Update a workout entry."""
    workout = await log_service.update_workout(
        user_id=current_user.id,
        workout_id=workout_id,
        **request.model_dump(exclude_unset=True),
    )
    return WorkoutResponse(
        id=workout.id,
        daily_log_id=workout.daily_log_id,
        user_id=workout.user_id,
        exercise_type=workout.exercise_type,
        duration_min=workout.duration_min,
        intensity=workout.intensity,
        calories_burned=workout.calories_burned,
        notes=workout.notes,
        created_at=workout.created_at,
    )


@router.delete("/{workout_id}", status_code=204)
async def delete_workout(
    workout_id: UUID,
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Delete a workout entry."""
    await log_service.delete_workout(current_user.id, workout_id)
    return None


@router.get("", response_model=List[WorkoutResponse])
async def get_workouts(
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Get workouts for a date range."""
    workouts = await log_service.get_workouts_in_range(current_user.id, start, end)
    return [
        WorkoutResponse(
            id=w.id,
            daily_log_id=w.daily_log_id,
            user_id=w.user_id,
            exercise_type=w.exercise_type,
            duration_min=w.duration_min,
            intensity=w.intensity,
            calories_burned=w.calories_burned,
            notes=w.notes,
            created_at=w.created_at,
        )
        for w in workouts
    ]
