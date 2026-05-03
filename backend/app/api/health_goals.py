from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, get_redis_client
from app.core.exceptions import NotFoundException
from app.core.redis import RedisClient
from app.models.health_goal import HealthGoal
from app.models.user import User
from app.schemas.health_goal import (
    HealthGoalCreate,
    HealthGoalResponse,
    HealthGoalUpdate,
)

router = APIRouter(prefix="/health-goals", tags=["health-goals"])


@router.post("", response_model=HealthGoalResponse, status_code=201)
async def create_health_goal(
    request: HealthGoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new health goal."""
    goal = HealthGoal(
        user_id=current_user.id,
        goal_type=request.goal_type,
        target_value=request.target_value,
        current_value=request.current_value,
        unit=request.unit,
        start_date=request.start_date,
        target_date=request.target_date,
    )
    db.add(goal)
    await db.flush()
    await db.refresh(goal)

    return HealthGoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        goal_type=goal.goal_type.value if hasattr(goal.goal_type, 'value') else str(goal.goal_type),
        target_value=goal.target_value,
        current_value=goal.current_value,
        unit=goal.unit,
        start_date=goal.start_date,
        target_date=goal.target_date,
        is_active=goal.is_active,
        achieved_at=goal.achieved_at,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
    )


@router.get("", response_model=List[HealthGoalResponse])
async def get_health_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all health goals for the current user."""
    result = await db.execute(
        select(HealthGoal)
        .where(HealthGoal.user_id == current_user.id)
        .order_by(HealthGoal.created_at.desc())
    )
    goals = result.scalars().all()

    return [
        HealthGoalResponse(
            id=g.id,
            user_id=g.user_id,
            goal_type=g.goal_type.value if hasattr(g.goal_type, 'value') else str(g.goal_type),
            target_value=g.target_value,
            current_value=g.current_value,
            unit=g.unit,
            start_date=g.start_date,
            target_date=g.target_date,
            is_active=g.is_active,
            achieved_at=g.achieved_at,
            created_at=g.created_at,
            updated_at=g.updated_at,
        )
        for g in goals
    ]


@router.get("/{goal_id}", response_model=HealthGoalResponse)
async def get_health_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific health goal."""
    result = await db.execute(
        select(HealthGoal).where(
            HealthGoal.id == goal_id,
            HealthGoal.user_id == current_user.id,
        )
    )
    goal = result.scalars().first()

    if goal is None:
        raise NotFoundException("HealthGoal", str(goal_id))

    return HealthGoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        goal_type=goal.goal_type.value if hasattr(goal.goal_type, 'value') else str(goal.goal_type),
        target_value=goal.target_value,
        current_value=goal.current_value,
        unit=goal.unit,
        start_date=goal.start_date,
        target_date=goal.target_date,
        is_active=goal.is_active,
        achieved_at=goal.achieved_at,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
    )


@router.put("/{goal_id}", response_model=HealthGoalResponse)
async def update_health_goal(
    goal_id: UUID,
    request: HealthGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a health goal."""
    result = await db.execute(
        select(HealthGoal).where(
            HealthGoal.id == goal_id,
            HealthGoal.user_id == current_user.id,
        )
    )
    goal = result.scalars().first()

    if goal is None:
        raise NotFoundException("HealthGoal", str(goal_id))

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(goal, field, value)

    await db.flush()
    await db.refresh(goal)

    return HealthGoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        goal_type=goal.goal_type.value if hasattr(goal.goal_type, 'value') else str(goal.goal_type),
        target_value=goal.target_value,
        current_value=goal.current_value,
        unit=goal.unit,
        start_date=goal.start_date,
        target_date=goal.target_date,
        is_active=goal.is_active,
        achieved_at=goal.achieved_at,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
    )


@router.delete("/{goal_id}", status_code=204)
async def delete_health_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a health goal."""
    result = await db.execute(
        select(HealthGoal).where(
            HealthGoal.id == goal_id,
            HealthGoal.user_id == current_user.id,
        )
    )
    goal = result.scalars().first()

    if goal is None:
        raise NotFoundException("HealthGoal", str(goal_id))

    await db.delete(goal)
    await db.flush()
    return None
