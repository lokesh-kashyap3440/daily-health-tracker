from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Tuple
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.core.rabbitmq import rabbitmq_connection
from app.core.redis import RedisClient
from app.models.daily_log import DailyLog
from app.models.daily_log import DailyLog as DailyLogModel
from app.models.meal import Meal, MealType
from app.models.workout import Workout
from app.models.user import User


class LogService:
    def __init__(self, db: AsyncSession, redis: RedisClient):
        self.db = db
        self.redis = redis

    async def get_or_create_today_log(self, user_id: UUID) -> DailyLog:
        today = date.today()
        return await self.get_or_create_log_for_date(user_id, today)

    async def get_or_create_log_for_date(self, user_id: UUID, log_date: date) -> DailyLog:
        result = await self.db.execute(
            select(DailyLog)
            .options(selectinload(DailyLog.meals), selectinload(DailyLog.workouts))
            .where(DailyLog.user_id == user_id, DailyLog.log_date == log_date)
        )
        log = result.scalars().first()

        if log:
            return log

        log = DailyLog(
            id=uuid4(),
            user_id=user_id,
            log_date=log_date,
            water_glasses=0,
            sleep_hours=0.0,
            mood_rating=3,
        )
        self.db.add(log)
        await self.db.flush()
        await self.db.refresh(log)
        return log

    async def get_log_by_date(
        self, user_id: UUID, log_date: date
    ) -> Optional[DailyLog]:
        result = await self.db.execute(
            select(DailyLog)
            .options(selectinload(DailyLog.meals), selectinload(DailyLog.workouts))
            .where(DailyLog.user_id == user_id, DailyLog.log_date == log_date)
        )
        return result.scalars().first()

    async def get_logs_in_range(
        self,
        user_id: UUID,
        start_date: date,
        end_date: date,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[DailyLog], int]:
        # Count total
        count_stmt = select(func.count(DailyLog.id)).where(
            DailyLog.user_id == user_id,
            DailyLog.log_date.between(start_date, end_date),
        )
        total = (await self.db.execute(count_stmt)).scalar_one()

        # Fetch page
        query = (
            select(DailyLog)
            .options(selectinload(DailyLog.meals), selectinload(DailyLog.workouts))
            .where(
                DailyLog.user_id == user_id,
                DailyLog.log_date.between(start_date, end_date),
            )
            .order_by(DailyLog.log_date.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        logs = list(result.scalars().unique().all())

        return logs, total

    async def update_daily_log(
        self,
        user_id: UUID,
        log_date: date,
        water_glasses: Optional[int] = None,
        sleep_hours: Optional[float] = None,
        mood_rating: Optional[int] = None,
    ) -> DailyLog:
        log = await self.get_or_create_log_for_date(user_id, log_date)

        if water_glasses is not None:
            log.water_glasses = water_glasses
        if sleep_hours is not None:
            log.sleep_hours = sleep_hours
        if mood_rating is not None:
            log.mood_rating = mood_rating

        await self.db.flush()
        await self.db.refresh(log)

        # Invalidate dashboard cache
        await self.redis.delete(f"user:{user_id}:dashboard")
        await self.redis.delete_pattern(f"user:{user_id}:metrics:*")

        # Publish event to RabbitMQ
        try:
            await rabbitmq_connection.publish(
                "log.updated",
                {
                    "user_id": str(user_id),
                    "log_id": str(log.id),
                    "log_date": log_date.isoformat(),
                    "water_glasses": log.water_glasses,
                    "sleep_hours": log.sleep_hours,
                    "mood_rating": log.mood_rating,
                },
            )
        except Exception:
            pass  # Don't fail if RabbitMQ is down

        return log

    async def delete_log(self, user_id: UUID, log_id: UUID) -> None:
        result = await self.db.execute(
            select(DailyLog).where(DailyLog.id == log_id)
        )
        log = result.scalars().first()

        if log is None:
            raise NotFoundException("DailyLog", str(log_id))
        if log.user_id != user_id:
            raise ForbiddenException("Not authorized to delete this log")

        await self.db.delete(log)
        await self.db.flush()

        # Invalidate caches
        await self.redis.delete(f"user:{user_id}:dashboard")
        await self.redis.delete_pattern(f"user:{user_id}:metrics:*")

    # Meal operations
    async def add_meal(
        self,
        user_id: UUID,
        daily_log_id: UUID,
        meal_type: str,
        name: str,
        description: Optional[str] = None,
        calories: Optional[int] = None,
        protein_g: Optional[float] = None,
        carbs_g: Optional[float] = None,
        fat_g: Optional[float] = None,
        serving_size: Optional[str] = None,
    ) -> Meal:
        # Verify log belongs to user
        result = await self.db.execute(
            select(DailyLog).where(DailyLog.id == daily_log_id)
        )
        log = result.scalars().first()
        if log is None:
            raise NotFoundException("DailyLog", str(daily_log_id))
        if log.user_id != user_id:
            raise ForbiddenException("Not authorized")

        meal = Meal(
            id=uuid4(),
            daily_log_id=daily_log_id,
            user_id=user_id,
            meal_type=MealType(meal_type),
            name=name,
            description=description,
            calories=calories,
            protein_g=protein_g,
            carbs_g=carbs_g,
            fat_g=fat_g,
            serving_size=serving_size,
        )
        self.db.add(meal)
        await self.db.flush()
        await self.db.refresh(meal)

        # Invalidate cache
        await self.redis.delete(f"user:{user_id}:dashboard")

        return meal

    async def update_meal(
        self,
        user_id: UUID,
        meal_id: UUID,
        **kwargs,
    ) -> Meal:
        result = await self.db.execute(
            select(Meal).where(Meal.id == meal_id)
        )
        meal = result.scalars().first()
        if meal is None:
            raise NotFoundException("Meal", str(meal_id))
        if meal.user_id != user_id:
            raise ForbiddenException("Not authorized")

        for field, value in kwargs.items():
            if value is not None and hasattr(meal, field):
                if field == "meal_type":
                    setattr(meal, field, MealType(value))
                else:
                    setattr(meal, field, value)

        await self.db.flush()
        await self.db.refresh(meal)
        await self.redis.delete(f"user:{user_id}:dashboard")
        return meal

    async def delete_meal(self, user_id: UUID, meal_id: UUID) -> None:
        result = await self.db.execute(
            select(Meal).where(Meal.id == meal_id)
        )
        meal = result.scalars().first()
        if meal is None:
            raise NotFoundException("Meal", str(meal_id))
        if meal.user_id != user_id:
            raise ForbiddenException("Not authorized")

        await self.db.delete(meal)
        await self.db.flush()
        await self.redis.delete(f"user:{user_id}:dashboard")

    async def get_meals_in_range(
        self, user_id: UUID, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> List[Meal]:
        query = select(Meal).where(Meal.user_id == user_id)

        if start_date and end_date:
            query = query.join(DailyLog).where(
                DailyLog.log_date.between(start_date, end_date)
            )

        query = query.order_by(Meal.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().unique().all())

    # Workout operations
    async def add_workout(
        self,
        user_id: UUID,
        daily_log_id: UUID,
        exercise_type: str,
        duration_min: int,
        intensity: str = "moderate",
        calories_burned: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> Workout:
        result = await self.db.execute(
            select(DailyLog).where(DailyLog.id == daily_log_id)
        )
        log = result.scalars().first()
        if log is None:
            raise NotFoundException("DailyLog", str(daily_log_id))
        if log.user_id != user_id:
            raise ForbiddenException("Not authorized")

        workout = Workout(
            id=uuid4(),
            daily_log_id=daily_log_id,
            user_id=user_id,
            exercise_type=exercise_type,
            duration_min=duration_min,
            intensity=intensity,
            calories_burned=calories_burned,
            notes=notes,
        )
        self.db.add(workout)
        await self.db.flush()
        await self.db.refresh(workout)
        await self.redis.delete(f"user:{user_id}:dashboard")
        return workout

    async def update_workout(
        self,
        user_id: UUID,
        workout_id: UUID,
        **kwargs,
    ) -> Workout:
        result = await self.db.execute(
            select(Workout).where(Workout.id == workout_id)
        )
        workout = result.scalars().first()
        if workout is None:
            raise NotFoundException("Workout", str(workout_id))
        if workout.user_id != user_id:
            raise ForbiddenException("Not authorized")

        for field, value in kwargs.items():
            if value is not None and hasattr(workout, field):
                setattr(workout, field, value)

        await self.db.flush()
        await self.db.refresh(workout)
        await self.redis.delete(f"user:{user_id}:dashboard")
        return workout

    async def delete_workout(self, user_id: UUID, workout_id: UUID) -> None:
        result = await self.db.execute(
            select(Workout).where(Workout.id == workout_id)
        )
        workout = result.scalars().first()
        if workout is None:
            raise NotFoundException("Workout", str(workout_id))
        if workout.user_id != user_id:
            raise ForbiddenException("Not authorized")

        await self.db.delete(workout)
        await self.db.flush()
        await self.redis.delete(f"user:{user_id}:dashboard")

    async def get_workouts_in_range(
        self, user_id: UUID, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> List[Workout]:
        query = select(Workout).where(Workout.user_id == user_id)

        if start_date and end_date:
            query = query.join(DailyLog).where(
                DailyLog.log_date.between(start_date, end_date)
            )

        query = query.order_by(Workout.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().unique().all())
