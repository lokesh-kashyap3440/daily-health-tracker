import json
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

import httpx
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.core.exceptions import ExternalAPIException, NotFoundException, RateLimitException
from app.core.rabbitmq import rabbitmq_connection
from app.core.redis import RedisClient
from app.models.daily_log import DailyLog
from app.models.suggestion import DailySuggestion, SuggestionCategory
from app.models.user import User, UserProfile

SUGGESTION_PROMPT_TEMPLATE = (
    "Based on the user's health data below, generate ONE specific, actionable health "
    "tip for today. The tip should address the most impactful area for improvement.\n\n"
    "User Profile:\n"
    "- Age: {age}\n"
    "- Goals: {fitness_goal}\n"
    "- Diet: {dietary_pref}\n"
    "- Activity: {activity_level}\n\n"
    "Recent 7-Day Summary:\n"
    "{recent_logs_summary}\n\n"
    "Response format (return ONLY valid JSON, no other text):\n"
    '{{\n'
    '  "category": "diet" | "workout" | "sleep" | "hydration" | "general_wellness",\n'
    '  "title": "Short, catchy title (under 60 chars)",\n'
    '  "content": "Specific actionable tip (2-4 sentences). Reference users actual data."\n'
    '}}'
)

_shared_suggestion_http_client: Optional[httpx.AsyncClient] = None


class SuggestionService:
    def __init__(self, db: AsyncSession, redis: RedisClient):
        self.db = db
        self.redis = redis
        self._http_client: Optional[httpx.AsyncClient] = None

    async def _get_http_client(self) -> Optional[httpx.AsyncClient]:
        if not settings.DEEPSEEK_API_KEY:
            return None
        global _shared_suggestion_http_client
        if _shared_suggestion_http_client is None or _shared_suggestion_http_client.is_closed:
            _shared_suggestion_http_client = httpx.AsyncClient(
                base_url="https://api.deepseek.com/v1",
                headers={
                    "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=httpx.Timeout(settings.DEEPSEEK_TIMEOUT, connect=10),
            )
        return _shared_suggestion_http_client

    async def close(self):
        global _shared_suggestion_http_client
        if _shared_suggestion_http_client and not _shared_suggestion_http_client.is_closed:
            await _shared_suggestion_http_client.aclose()
            _shared_suggestion_http_client = None

    async def get_today_suggestion(self, user_id: UUID) -> Optional[DailySuggestion]:
        today = date.today()
        cache_key = f"user:{user_id}:suggestion:today"

        # Check Redis cache first — if present and not dismissed, fetch from DB
        cached = await self.redis.get_json(cache_key)
        if cached and not cached.get("is_dismissed"):
            result = await self.db.execute(
                select(DailySuggestion)
                .where(
                    DailySuggestion.user_id == user_id,
                    DailySuggestion.suggestion_date == today,
                )
                .order_by(DailySuggestion.created_at.desc())
                .limit(1)
            )
            suggestion = result.scalars().first()
            if suggestion:
                return suggestion

        # No cache hit — query DB directly
        result = await self.db.execute(
            select(DailySuggestion)
            .where(
                DailySuggestion.user_id == user_id,
                DailySuggestion.suggestion_date == today,
            )
            .order_by(DailySuggestion.created_at.desc())
            .limit(1)
        )
        suggestion = result.scalars().first()

        if suggestion:
            await self._cache_suggestion(user_id, suggestion)

        return suggestion

    async def get_recent_suggestions(
        self,
        user_id: UUID,
        limit: int = 10,
        include_dismissed: bool = False,
    ) -> List[DailySuggestion]:
        query = select(DailySuggestion).where(
            DailySuggestion.user_id == user_id,
        )

        if not include_dismissed:
            query = query.where(DailySuggestion.is_dismissed == False)

        query = query.order_by(DailySuggestion.created_at.desc()).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def generate_suggestion(self, user_id: UUID, force: bool = False) -> DailySuggestion:
        # Check if already generated today (skip when force=True, e.g. on refresh)
        if not force:
            existing = await self.get_today_suggestion(user_id)
            if existing and not existing.is_dismissed:
                return existing

        # Get user profile and recent logs
        profile_result = await self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalars().first()

        user_result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalars().first()

        if not user:
            raise NotFoundException("User", str(user_id))

        if not user.suggestions_enabled:
            raise ValueError("Suggestions are disabled for this user")

        # Get last 7 days of logs
        seven_days_ago = date.today() - timedelta(days=7)
        logs_result = await self.db.execute(
            select(DailyLog)
            .options(selectinload(DailyLog.meals), selectinload(DailyLog.workouts))
            .where(
                DailyLog.user_id == user_id,
                DailyLog.log_date >= seven_days_ago,
            )
            .order_by(DailyLog.log_date.desc())
        )
        recent_logs = list(logs_result.scalars().unique().all())

        # Build prompt
        logs_summary = self._build_logs_summary(recent_logs)
        prompt = SUGGESTION_PROMPT_TEMPLATE.format(
            age=profile.age if profile and profile.age else "Not specified",
            fitness_goal=(profile.fitness_goal.value if hasattr(profile.fitness_goal, 'value') else profile.fitness_goal) if profile and profile.fitness_goal else "Not specified",
            dietary_pref=(profile.dietary_preference.value if hasattr(profile.dietary_preference, 'value') else profile.dietary_preference) if profile and profile.dietary_preference else "Not specified",
            activity_level=(profile.activity_level.value if hasattr(profile.activity_level, 'value') else profile.activity_level) if profile and profile.activity_level else "Not specified",
            recent_logs_summary=logs_summary,
        )

        try:
            # Call DeepSeek API
            client = await self._get_http_client()
            if client is None:
                raise ExternalAPIException(
                    "DEEPSEEK_API_KEY not configured — set it in Render dashboard",
                    status_code=503,
                )
            response = await client.post(
                "/chat/completions",
                json={
                    "model": settings.DEEPSEEK_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are a health suggestion generator."},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()
            ai_content = data["choices"][0]["message"]["content"]

        except httpx.HTTPStatusError as e:
            raise ExternalAPIException(
                f"DeepSeek API error: {e.response.status_code}",
                status_code=e.response.status_code,
            )
        except httpx.TimeoutException:
            raise ExternalAPIException("DeepSeek API timed out", status_code=504)
        except Exception as e:
            raise ExternalAPIException(f"Failed to generate suggestion: {str(e)}")

        # Parse JSON response
        try:
            # Strip markdown code blocks if present
            cleaned = ai_content.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1]
                cleaned = cleaned.rsplit("\n", 1)[0]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            suggestion_data = json.loads(cleaned)
            category_str = suggestion_data.get("category", "general_wellness")
            title = suggestion_data.get("title", "Health Tip")
            content = suggestion_data.get(
                "content",
                "Focus on maintaining a balanced diet and regular exercise.",
            )
        except (json.JSONDecodeError, KeyError):
            # Fallback: use raw AI content as the suggestion
            category_str = "general_wellness"
            title = "Daily Health Tip"
            content = ai_content

        # Map category string to enum
        try:
            category = SuggestionCategory(category_str)
        except ValueError:
            category = SuggestionCategory.GENERAL_WELLNESS

        # Persist suggestion
        today = date.today()
        suggestion = DailySuggestion(
            id=uuid4(),
            user_id=user_id,
            suggestion_date=today,
            category=category,
            title=title[:200],
            content=content,
            metadata={
                "model": data.get("model", settings.DEEPSEEK_MODEL),
            },
        )
        self.db.add(suggestion)
        await self.db.flush()
        await self.db.refresh(suggestion)

        # Cache suggestion
        await self._cache_suggestion(user_id, suggestion)

        # Publish event
        try:
            await rabbitmq_connection.publish(
                "suggestion.generated",
                {
                    "user_id": str(user_id),
                    "suggestion_id": str(suggestion.id),
                    "category": category.value,
                    "title": title,
                    "summary": content[:100],
                },
                exchange_name="health.events",
            )
        except Exception:
            pass

        return suggestion

    async def refresh_suggestion(self, user_id: UUID) -> DailySuggestion:
        # Delete existing today's suggestion from DB so a fresh one is generated
        today = date.today()
        result = await self.db.execute(
            select(DailySuggestion).where(
                DailySuggestion.user_id == user_id,
                DailySuggestion.suggestion_date == today,
            )
        )
        existing = result.scalars().all()
        for s in existing:
            await self.db.delete(s)
        await self.db.flush()

        # Clear cache
        await self.redis.delete(f"user:{user_id}:suggestion:today")

        # Generate fresh suggestion (force=True skips the existing-check guard)
        return await self.generate_suggestion(user_id, force=True)

    async def dismiss_suggestion(self, user_id: UUID, suggestion_id: UUID) -> None:
        result = await self.db.execute(
            select(DailySuggestion).where(
                DailySuggestion.id == suggestion_id,
                DailySuggestion.user_id == user_id,
            )
        )
        suggestion = result.scalars().first()

        if suggestion is None:
            raise NotFoundException("DailySuggestion", str(suggestion_id))

        suggestion.is_dismissed = True
        await self.db.flush()
        await self.redis.delete(f"user:{user_id}:suggestion:today")

    async def _cache_suggestion(self, user_id: UUID, suggestion: DailySuggestion) -> None:
        cache_key = f"user:{user_id}:suggestion:today"
        await self.redis.set_json(
            cache_key,
            {
                "id": str(suggestion.id),
                "user_id": str(suggestion.user_id),
                "suggestion_date": suggestion.suggestion_date.isoformat(),
                "category": suggestion.category.value,
                "title": suggestion.title,
                "content": suggestion.content,
                "is_dismissed": suggestion.is_dismissed,
                "created_at": suggestion.created_at.isoformat(),
            },
            ttl=14400,  # 4 hours
        )

    def _build_logs_summary(self, recent_logs: List[DailyLog]) -> str:
        if not recent_logs:
            return "No recent activity logged."

        summary_parts = []
        for log in recent_logs:
            meals_str = ", ".join(
                f"{m.meal_type.value if hasattr(m.meal_type, 'value') else m.meal_type}: {m.name}" for m in (log.meals or [])
            ) or "No meals"
            workouts_str = ", ".join(
                f"{w.exercise_type} ({w.duration_min}min)" for w in (log.workouts or [])
            ) or "No workouts"
            summary_parts.append(
                f"- {log.log_date}: Meals [{meals_str}], "
                f"Workouts [{workouts_str}], "
                f"Water: {log.water_glasses} glasses, "
                f"Sleep: {log.sleep_hours}h, "
                f"Mood: {log.mood_rating}/5"
            )

        return "\n".join(summary_parts)
