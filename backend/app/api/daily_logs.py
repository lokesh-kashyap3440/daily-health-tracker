from datetime import date, datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, get_redis_client
from app.core.exceptions import NotFoundException
from app.core.redis import RedisClient
from app.models.user import User
from app.schemas.daily_log import (
    DailyLogCreate,
    DailyLogResponse,
    DailyLogUpdate,
    MealSummary,
    UpdateMoodRequest,
    UpdateSleepRequest,
    UpdateWaterRequest,
    WorkoutSummary,
)
from app.services.log_service import LogService

router = APIRouter(prefix="/daily-logs", tags=["daily-logs"])


def get_log_service(
    db: AsyncSession = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client),
) -> LogService:
    return LogService(db=db, redis=redis)


@router.post("", response_model=DailyLogResponse, status_code=201)
async def create_daily_log(
    request: DailyLogCreate,
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Create or update today's daily log."""
    log = await log_service.get_or_create_log_for_date(
        current_user.id, request.log_date
    )
    log = await log_service.update_daily_log(
        user_id=current_user.id,
        log_date=request.log_date,
        water_glasses=request.water_glasses,
        sleep_hours=request.sleep_hours,
        mood_rating=request.mood_rating,
    )
    return _log_to_response(log)


@router.get("/today", response_model=DailyLogResponse)
async def get_today_log(
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Get today's daily log."""
    log = await log_service.get_or_create_today_log(current_user.id)
    return _log_to_response(log)


@router.get("/date/{log_date}", response_model=DailyLogResponse)
async def get_log_by_date(
    log_date: date,
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Get daily log for a specific date."""
    log = await log_service.get_log_by_date(current_user.id, log_date)
    if log is None:
        raise NotFoundException("DailyLog", log_date.isoformat())
    return _log_to_response(log)


@router.get("/range", response_model=dict)
async def get_logs_in_range(
    start: date = Query(...),
    end: date = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Get daily logs for a date range with pagination."""
    logs, total = await log_service.get_logs_in_range(
        current_user.id, start, end, page, page_size
    )
    return {
        "items": [_log_to_response(log) for log in logs],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.put("/water", response_model=DailyLogResponse)
async def update_water(
    request: UpdateWaterRequest,
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Update water intake for today."""
    log = await log_service.update_daily_log(
        user_id=current_user.id,
        log_date=date.today(),
        water_glasses=request.glasses,
    )
    return _log_to_response(log)


@router.put("/sleep", response_model=DailyLogResponse)
async def update_sleep(
    request: UpdateSleepRequest,
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Update sleep hours for today."""
    log = await log_service.update_daily_log(
        user_id=current_user.id,
        log_date=date.today(),
        sleep_hours=request.hours,
    )
    return _log_to_response(log)


@router.put("/mood", response_model=DailyLogResponse)
async def update_mood(
    request: UpdateMoodRequest,
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Update mood rating for today."""
    log = await log_service.update_daily_log(
        user_id=current_user.id,
        log_date=date.today(),
        mood_rating=request.rating,
    )
    return _log_to_response(log)


@router.delete("/{log_id}", status_code=204)
async def delete_daily_log(
    log_id: UUID,
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Delete a daily log."""
    await log_service.delete_log(current_user.id, log_id)
    return None


def _log_to_response(log) -> DailyLogResponse:
    return DailyLogResponse(
        id=log.id,
        user_id=log.user_id,
        log_date=log.log_date,
        water_glasses=log.water_glasses or 0,
        sleep_hours=float(log.sleep_hours or 0.0),
        sleep_quality=getattr(log, 'sleep_quality', 0) or 0,
        mood_rating=log.mood_rating or 3,
        weight_kg=getattr(log, 'weight_kg', None),
        meals=[
            MealSummary(
                id=m.id,
                meal_type=m.meal_type.value if hasattr(m.meal_type, 'value') else str(m.meal_type),
                name=m.name,
                calories=m.calories,
                protein_g=m.protein_g,
                carbs_g=m.carbs_g,
                fat_g=m.fat_g,
            )
            for m in (log.meals or [])
        ],
        workouts=[
            WorkoutSummary(
                id=w.id,
                exercise_type=w.exercise_type,
                duration_min=w.duration_min,
                intensity=w.intensity,
                calories_burned=w.calories_burned,
            )
            for w in (log.workouts or [])
        ],
        created_at=log.created_at,
        updated_at=log.updated_at,
    )
