from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, get_redis_client
from app.core.redis import RedisClient
from app.models.user import User
from app.schemas.meal import MealCreate, MealResponse, MealUpdate
from app.services.log_service import LogService

router = APIRouter(prefix="/meals", tags=["meals"])


def get_log_service(
    db: AsyncSession = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client),
) -> LogService:
    return LogService(db=db, redis=redis)


@router.post("", response_model=MealResponse, status_code=201)
async def create_meal(
    request: MealCreate,
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Add a meal entry."""
    meal = await log_service.add_meal(
        user_id=current_user.id,
        daily_log_id=request.daily_log_id,
        meal_type=request.meal_type,
        name=request.name,
        description=request.description,
        calories=request.calories,
        protein_g=request.protein_g,
        carbs_g=request.carbs_g,
        fat_g=request.fat_g,
        serving_size=request.serving_size,
    )
    return MealResponse(
        id=meal.id,
        daily_log_id=meal.daily_log_id,
        user_id=meal.user_id,
        meal_type=meal.meal_type.value if hasattr(meal.meal_type, 'value') else str(meal.meal_type),
        name=meal.name,
        description=meal.description,
        calories=meal.calories,
        protein_g=meal.protein_g,
        carbs_g=meal.carbs_g,
        fat_g=meal.fat_g,
        serving_size=meal.serving_size,
        created_at=meal.created_at,
    )


@router.put("/{meal_id}", response_model=MealResponse)
async def update_meal(
    meal_id: UUID,
    request: MealUpdate,
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Update a meal entry."""
    meal = await log_service.update_meal(
        user_id=current_user.id,
        meal_id=meal_id,
        **request.model_dump(exclude_unset=True),
    )
    return MealResponse(
        id=meal.id,
        daily_log_id=meal.daily_log_id,
        user_id=meal.user_id,
        meal_type=meal.meal_type.value if hasattr(meal.meal_type, 'value') else str(meal.meal_type),
        name=meal.name,
        description=meal.description,
        calories=meal.calories,
        protein_g=meal.protein_g,
        carbs_g=meal.carbs_g,
        fat_g=meal.fat_g,
        serving_size=meal.serving_size,
        created_at=meal.created_at,
    )


@router.delete("/{meal_id}", status_code=204)
async def delete_meal(
    meal_id: UUID,
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Delete a meal entry."""
    await log_service.delete_meal(current_user.id, meal_id)
    return None


@router.get("", response_model=List[MealResponse])
async def get_meals(
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    """Get meals for a date range."""
    meals = await log_service.get_meals_in_range(current_user.id, start, end)
    return [
        MealResponse(
            id=m.id,
            daily_log_id=m.daily_log_id,
            user_id=m.user_id,
            meal_type=m.meal_type.value if hasattr(m.meal_type, 'value') else str(m.meal_type),
            name=m.name,
            description=m.description,
            calories=m.calories,
            protein_g=m.protein_g,
            carbs_g=m.carbs_g,
            fat_g=m.fat_g,
            serving_size=m.serving_size,
            created_at=m.created_at,
        )
        for m in meals
    ]
