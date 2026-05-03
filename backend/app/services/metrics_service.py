from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException
from app.core.redis import RedisClient
from app.models.daily_log import DailyLog
from app.models.meal import Meal
from app.models.user import User, UserProfile
from app.models.workout import Workout


class MetricsService:
    def __init__(self, db: AsyncSession, redis: RedisClient):
        self.db = db
        self.redis = redis

    async def get_weight_history(
        self, user_id: UUID, days: int = 30
    ) -> List[Dict[str, Any]]:
        # Check cache
        cache_key = f"user:{user_id}:metrics:{days}"
        cached = await self.redis.get_json(cache_key)
        if cached:
            return cached.get("weight_history", [])

        start_date = date.today() - timedelta(days=days)

        # Get weight from user profile updates and daily logs
        profile_result = await self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalars().first()

        # Get daily logs with weight from a separate weight tracking
        # For now, use profile weight as current and logs for historical
        result = await self.db.execute(
            select(DailyLog.log_date, DailyLog.weight_kg)
            .where(
                DailyLog.user_id == user_id,
                DailyLog.log_date >= start_date,
                DailyLog.weight_kg.isnot(None),
            )
            .order_by(DailyLog.log_date.asc())
        )
        rows = result.all()

        weight_data = [
            {"date": row.log_date.isoformat(), "weight_kg": float(row.weight_kg)}
            for row in rows
        ]

        # Cache result
        await self.redis.set_json(
            cache_key, {"weight_history": weight_data}, ttl=600
        )

        return weight_data

    async def get_bmi_history(
        self, user_id: UUID, days: int = 30
    ) -> List[Dict[str, Any]]:
        cache_key = f"user:{user_id}:metrics:bmi:{days}"
        cached = await self.redis.get_json(cache_key)
        if cached:
            return cached.get("bmi_history", [])

        # Get user height
        profile_result = await self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalars().first()

        if not profile or not profile.height_cm:
            return []

        height_m = profile.height_cm / 100.0
        if height_m <= 0:
            return []

        start_date = date.today() - timedelta(days=days)

        # Get weight records from daily logs
        result = await self.db.execute(
            select(DailyLog.log_date, DailyLog.weight_kg)
            .where(
                DailyLog.user_id == user_id,
                DailyLog.log_date >= start_date,
                DailyLog.weight_kg.isnot(None),
            )
            .order_by(DailyLog.log_date.asc())
        )
        rows = result.all()

        bmi_data = [
            {
                "date": row.log_date.isoformat(),
                "bmi": round(float(row.weight_kg) / (height_m * height_m), 2),
            }
            for row in rows
        ]

        # Cache
        await self.redis.set_json(
            cache_key, {"bmi_history": bmi_data}, ttl=600
        )

        return bmi_data

    async def record_weight(
        self, user_id: UUID, weight_kg: float, record_date: date, notes: Optional[str] = None
    ) -> Dict[str, Any]:
        # Update or create daily log with weight
        result = await self.db.execute(
            select(DailyLog).where(
                DailyLog.user_id == user_id,
                DailyLog.log_date == record_date,
            )
        )
        log = result.scalars().first()

        if log:
            if log.weight_kg is not None:
                raise ConflictException(
                    f"Weight already recorded for {record_date.isoformat()}"
                )
            log.weight_kg = weight_kg
        else:
            log = DailyLog(
                user_id=user_id,
                log_date=record_date,
                weight_kg=weight_kg,
            )
            self.db.add(log)

        await self.db.flush()

        # Also update profile current weight
        profile_result = await self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalars().first()
        if profile:
            profile.weight_kg = weight_kg

        await self.db.flush()

        # Invalidate cache
        await self._invalidate_metrics_cache(user_id)

        return {
            "date": record_date.isoformat(),
            "weight_kg": weight_kg,
        }

    async def get_metrics_summary(
        self, user_id: UUID, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        # Aggregate daily log stats
        stmt = select(
            func.coalesce(func.avg(DailyLog.water_glasses), 0).label("avg_water"),
            func.coalesce(func.avg(DailyLog.sleep_hours), 0).label("avg_sleep"),
            func.coalesce(func.avg(DailyLog.mood_rating), 0).label("avg_mood"),
            func.count(DailyLog.id).label("total_days"),
        ).where(
            DailyLog.user_id == user_id,
            DailyLog.log_date.between(start_date, end_date),
        )
        result = await self.db.execute(stmt)
        row = result.one()

        avg_water = round(float(row.avg_water), 1)
        avg_sleep = round(float(row.avg_sleep), 1)
        avg_mood = round(float(row.avg_mood), 1)

        # Count workouts in range
        workout_stmt = (
            select(func.count(Workout.id))
            .join(DailyLog)
            .where(
                DailyLog.user_id == user_id,
                DailyLog.log_date.between(start_date, end_date),
            )
        )
        total_workouts = (await self.db.execute(workout_stmt)).scalar_one()

        # Average daily calories from meals
        calories_stmt = (
            select(func.coalesce(func.avg(Meal.calories), 0))
            .join(DailyLog)
            .where(
                DailyLog.user_id == user_id,
                DailyLog.log_date.between(start_date, end_date),
            )
        )
        avg_calories = (await self.db.execute(calories_stmt)).scalar_one()
        avg_calories = round(float(avg_calories), 0)

        # Weight change
        weight_change = await self._get_weight_change(user_id, start_date, end_date)

        return {
            "period_start": start_date.isoformat(),
            "period_end": end_date.isoformat(),
            "avg_water_glasses": avg_water,
            "avg_sleep_hours": avg_sleep,
            "avg_mood": avg_mood,
            "total_workouts": total_workouts,
            "avg_daily_calories": avg_calories if avg_calories > 0 else None,
            "weight_change_kg": weight_change,
        }

    async def _get_weight_change(
        self, user_id: UUID, start_date: date, end_date: date
    ) -> Optional[float]:
        # Get first and last weight in range
        first_stmt = (
            select(DailyLog.weight_kg)
            .where(
                DailyLog.user_id == user_id,
                DailyLog.log_date.between(start_date, end_date),
                DailyLog.weight_kg.isnot(None),
            )
            .order_by(DailyLog.log_date.asc())
            .limit(1)
        )
        last_stmt = (
            select(DailyLog.weight_kg)
            .where(
                DailyLog.user_id == user_id,
                DailyLog.log_date.between(start_date, end_date),
                DailyLog.weight_kg.isnot(None),
            )
            .order_by(DailyLog.log_date.desc())
            .limit(1)
        )

        first = (await self.db.execute(first_stmt)).scalar_one_or_none()
        last = (await self.db.execute(last_stmt)).scalar_one_or_none()

        if first is not None and last is not None:
            return round(float(last) - float(first), 2)
        return None

    async def get_dashboard_summary(self, user_id: UUID) -> Dict[str, Any]:
        """Get today's summary for the dashboard."""
        today = date.today()

        # Get today's log
        result = await self.db.execute(
            select(DailyLog)
            .where(
                DailyLog.user_id == user_id,
                DailyLog.log_date == today,
            )
        )
        today_log = result.scalars().first()

        # Get last 7 days summary
        week_ago = today - timedelta(days=7)
        return await self.get_metrics_summary(user_id, week_ago, today)

    async def _invalidate_metrics_cache(self, user_id: UUID) -> None:
        await self.redis.delete_pattern(f"user:{user_id}:metrics:*")
        await self.redis.delete(f"user:{user_id}:dashboard")
