from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, get_redis_client
from app.core.exceptions import NotFoundException
from app.core.redis import RedisClient
from app.models.user import User, UserProfile
from app.schemas.user import (
    UserPreferencesResponse,
    UserProfileResponse,
    UserProfileUpdate,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Get the current user's profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        is_active=current_user.is_active,
        suggestions_enabled=current_user.suggestions_enabled,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client),
):
    """Update the current user's profile and preferences."""
    # Get or create user profile
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if profile is None:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    # Update profile fields
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None and hasattr(profile, field):
            setattr(profile, field, value)

    # Update suggestions_enabled on user model if provided
    if update.suggestions_enabled is not None:
        current_user.suggestions_enabled = update.suggestions_enabled

    await db.flush()

    # Invalidate profile cache
    await redis.delete(f"user:{current_user.id}:profile")

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        is_active=current_user.is_active,
        suggestions_enabled=current_user.suggestions_enabled,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.get("/me/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client),
):
    """Get the current user's detailed profile."""
    # Check cache
    cache_key = f"user:{current_user.id}:profile"
    cached = await redis.get_json(cache_key)
    if cached:
        return UserProfileResponse(**cached)

    # Get from DB
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if profile is None:
        raise NotFoundException("UserProfile", str(current_user.id))

    # Cache profile
    await redis.set_json(cache_key, profile.to_dict() if hasattr(profile, 'to_dict') else {}, ttl=3600)

    return UserProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        age=profile.age,
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        dietary_preference=profile.dietary_preference.value if profile.dietary_preference else None,
        fitness_goal=profile.fitness_goal.value if profile.fitness_goal else None,
        activity_level=profile.activity_level.value if profile.activity_level else None,
        allergies=profile.allergies or [],
        cuisine_preference=profile.cuisine_preference,
        target_weight_kg=profile.target_weight_kg,
        target_date=profile.target_date,
        workout_days_per_week=profile.workout_days_per_week,
        daily_calorie_target=profile.daily_calorie_target,
        daily_protein_target_g=profile.daily_protein_target_g,
        daily_water_glasses=profile.daily_water_glasses,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get("/me/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's dietary preferences and goals."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if profile is None:
        return UserPreferencesResponse(
            suggestions_enabled=current_user.suggestions_enabled,
        )

    return UserPreferencesResponse(
        dietary_preference=profile.dietary_preference.value if profile.dietary_preference else None,
        fitness_goal=profile.fitness_goal.value if profile.fitness_goal else None,
        activity_level=profile.activity_level.value if profile.activity_level else None,
        suggestions_enabled=current_user.suggestions_enabled,
        allergies=profile.allergies or [],
        cuisine_preference=profile.cuisine_preference,
        daily_calorie_target=profile.daily_calorie_target,
        daily_protein_target_g=profile.daily_protein_target_g,
        daily_water_glasses=profile.daily_water_glasses,
        workout_days_per_week=profile.workout_days_per_week,
    )


@router.put("/me/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client),
):
    """Update the current user's dietary preferences and goals."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if profile is None:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    # Update fields
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None and hasattr(profile, field):
            setattr(profile, field, value)

    if update.suggestions_enabled is not None:
        current_user.suggestions_enabled = update.suggestions_enabled

    await db.flush()
    await redis.delete(f"user:{current_user.id}:profile")

    return UserPreferencesResponse(
        dietary_preference=profile.dietary_preference.value if profile.dietary_preference else None,
        fitness_goal=profile.fitness_goal.value if profile.fitness_goal else None,
        activity_level=profile.activity_level.value if profile.activity_level else None,
        suggestions_enabled=current_user.suggestions_enabled,
        allergies=profile.allergies or [],
        cuisine_preference=profile.cuisine_preference,
        daily_calorie_target=profile.daily_calorie_target,
        daily_protein_target_g=profile.daily_protein_target_g,
        daily_water_glasses=profile.daily_water_glasses,
        workout_days_per_week=profile.workout_days_per_week,
    )
