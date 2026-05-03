import json
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID, uuid4

import httpx
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.core.exceptions import ExternalAPIException, NotFoundException, RateLimitException
from app.core.redis import RedisClient
from app.models.chat import ChatMessage, ChatRole, ChatSession
from app.models.daily_log import DailyLog
from app.models.user import User, UserProfile

SYSTEM_PROMPT = (
    "You are a knowledgeable health and fitness coach. "
    "Provide personalized diet tips, workout advice, and wellness recommendations. "
    "Be supportive, evidence-based, and practical."
)

_shared_http_client: Optional[httpx.AsyncClient] = None

DETAILED_SYSTEM_PROMPT = (
    "You are an expert health and wellness coach powered by DeepSeek. Your role is to "
    "provide personalized diet tips, workout advice, nutrition guidance, and general "
    "wellness support. Follow these guidelines strictly:\n\n"
    "1. BE SPECIFIC AND ACTIONABLE: Always give concrete, actionable advice. Avoid "
    "vague suggestions like 'eat healthier.' Instead say 'swap white rice for "
    "quinoa or cauliflower rice to increase fiber intake.'\n\n"
    "2. USE USER CONTEXT: Reference the user's profile (age, goals, preferences, "
    "activity level) when giving advice. If they are vegetarian, do not recommend "
    "meat-based protein sources.\n\n"
    "3. ADMIT LIMITATIONS: If asked for medical advice, diagnosis, or prescription "
    "information, clearly state 'I am an AI wellness coach, not a medical "
    "professional. Please consult your doctor for medical advice.'\n\n"
    "4. STAY POSITIVE AND MOTIVATIONAL: Use encouraging language. Acknowledge the "
    "user's efforts. Keep tone warm, supportive, and professional.\n\n"
    "5. BE CONCISE: Keep responses to 3-5 paragraphs maximum. Use bullet points "
    "for lists. No markdown formatting in responses.\n\n"
    "6. PULL FROM RECENT LOGS: When the user references their recent activity, "
    "acknowledge their actual logged data.\n\n"
    "7. NO HALLUCINATED DATA: Never invent specific calorie counts, exercise "
    "regimens, or meal plans. Provide general guidance only.\n\n"
    "8. RESPECT BOUNDARIES: Do not discuss sensitive health conditions, weight in "
    "judgmental terms, or encourage extreme dieting/exercise."
)


class ChatbotService:
    def __init__(self, db: AsyncSession, redis: RedisClient):
        self.db = db
        self.redis = redis
        self._http_client: Optional[httpx.AsyncClient] = None

    async def _get_http_client(self) -> httpx.AsyncClient:
        global _shared_http_client
        if _shared_http_client is None or _shared_http_client.is_closed:
            _shared_http_client = httpx.AsyncClient(
                base_url="https://api.deepseek.com/v1",
                headers={
                    "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=httpx.Timeout(settings.DEEPSEEK_TIMEOUT, connect=10),
            )
        return _shared_http_client

    async def _check_rate_limit(self, user_id: UUID) -> None:
        key = f"rate_limit:{user_id}:chat"
        try:
            current = await self.redis.incr(key)
            if current == 1:
                await self.redis.expire(key, 60)
            if current > settings.RATE_LIMIT_CHAT_PER_MINUTE:
                raise RateLimitException(
                    f"Chat rate limit exceeded. Max {settings.RATE_LIMIT_CHAT_PER_MINUTE} messages per minute."
                )
        except RateLimitException:
            raise
        except Exception:
            pass

    async def _load_history(
        self, user_id: UUID, session_id: UUID, limit: int = 20
    ) -> List[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(
                ChatMessage.user_id == user_id,
                ChatMessage.session_id == session_id,
            )
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        messages = list(result.scalars().all())
        return list(reversed(messages))  # oldest first

    async def _get_user_context(self, user_id: UUID) -> Tuple[Optional[User], Optional[UserProfile], List[DailyLog]]:
        # Get user with profile
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalars().first()

        profile_result = await self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalars().first()

        # Get recent logs (last 7 days)
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
        logs = list(logs_result.scalars().unique().all())

        return user, profile, logs

    def _build_context_block(
        self, user: Optional[User], profile: Optional[UserProfile], recent_logs: List[DailyLog]
    ) -> str:
        parts = ["User Profile:"]
        if profile:
            parts.append(f"- Age: {profile.age or 'Not specified'}")
            parts.append(f"- Height: {profile.height_cm or 'Not specified'} cm")
            parts.append(f"- Weight: {profile.weight_kg or 'Not specified'} kg")
            parts.append(
                f"- Dietary Preferences: {profile.dietary_preference.value if profile.dietary_preference else 'Not specified'}"
            )
            parts.append(
                f"- Fitness Goal: {profile.fitness_goal.value if profile.fitness_goal else 'Not specified'}"
            )
            parts.append(
                f"- Activity Level: {profile.activity_level.value if profile.activity_level else 'Not specified'}"
            )

        if recent_logs:
            parts.append("\nRecent Activity (last 7 days):")
            for log in recent_logs:
                meals_str = ", ".join(
                    f"{m.meal_type.value}: {m.name}" for m in (log.meals or [])
                ) or "No meals logged"
                workouts_str = ", ".join(
                    f"{w.exercise_type} ({w.duration_min}min)" for w in (log.workouts or [])
                ) or "No workouts"
                parts.append(
                    f"- {log.log_date}: Meals [{meals_str}] | "
                    f"Workouts [{workouts_str}] | "
                    f"Water: {log.water_glasses} glasses | "
                    f"Sleep: {log.sleep_hours}h | "
                    f"Mood: {log.mood_rating}/5"
                )

        return "\n".join(parts)

    async def send_message(
        self,
        user_id: UUID,
        session_id: Optional[UUID],
        content: str,
    ) -> Dict[str, Any]:
        # Rate limit check
        await self._check_rate_limit(user_id)

        # Create or retrieve session
        if session_id is None:
            session_id = uuid4()
            session = ChatSession(
                id=session_id,
                user_id=user_id,
                title=content[:50] + ("..." if len(content) > 50 else ""),
            )
            self.db.add(session)
            await self.db.flush()
        else:
            result = await self.db.execute(
                select(ChatSession).where(
                    ChatSession.id == session_id,
                    ChatSession.user_id == user_id,
                )
            )
            session = result.scalars().first()
            if session is None:
                raise NotFoundException("ChatSession", str(session_id))

        # Load conversation history
        history = await self._load_history(user_id, session_id)

        # Load user context
        user, profile, recent_logs = await self._get_user_context(user_id)

        # Build prompt messages
        context_block = self._build_context_block(user, profile, recent_logs)

        messages = [
            {"role": "system", "content": DETAILED_SYSTEM_PROMPT},
            {
                "role": "system",
                "content": f"Here is the user's current context:\n{context_block}",
            },
        ]

        # Add conversation history (last 20)
        for msg in history[-20:]:
            messages.append({
                "role": msg.role.value,
                "content": msg.content,
            })

        # Add current user message
        messages.append({"role": "user", "content": content})

        # Persist user message
        user_msg = ChatMessage(
            id=uuid4(),
            session_id=session_id,
            user_id=user_id,
            role=ChatRole.USER,
            content=content,
        )
        self.db.add(user_msg)
        await self.db.flush()

        try:
            # Call DeepSeek API
            client = await self._get_http_client()
            payload = {
                "model": settings.DEEPSEEK_MODEL,
                "messages": messages,
                "max_tokens": settings.DEEPSEEK_MAX_TOKENS,
                "temperature": settings.DEEPSEEK_TEMPERATURE,
                "user": str(user_id),
            }

            response = await client.post("/chat/completions", json=payload)
            response.raise_for_status()
            data = response.json()

            choice = data["choices"][0]
            ai_content = choice["message"]["content"]
            usage = data.get("usage", {})
            model = data.get("model", settings.DEEPSEEK_MODEL)

        except httpx.HTTPStatusError as e:
            raise ExternalAPIException(
                f"DeepSeek API error: {e.response.status_code}",
                status_code=e.response.status_code,
            )
        except httpx.TimeoutException:
            raise ExternalAPIException("DeepSeek API timed out", status_code=504)
        except Exception as e:
            raise ExternalAPIException(f"DeepSeek API error: {str(e)}")

        # Persist AI response
        ai_msg = ChatMessage(
            id=uuid4(),
            session_id=session_id,
            user_id=user_id,
            role=ChatRole.ASSISTANT,
            content=ai_content,
            metadata={
                "model": model,
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            },
        )
        self.db.add(ai_msg)

        # Update session timestamp and title if first message
        session.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(ai_msg)

        # Invalidate conversation cache
        await self.redis.delete(f"chat:session:{session_id}:messages")

        return {
            "session_id": session_id,
            "message_id": ai_msg.id,
            "role": "assistant",
            "content": ai_content,
            "created_at": ai_msg.created_at,
            "metadata": ai_msg.metadata,
        }

    async def stream_message(
        self,
        user_id: UUID,
        session_id: Optional[UUID],
        content: str,
    ):
        """Stream a chat response from DeepSeek API using SSE."""
        # Rate limit check
        await self._check_rate_limit(user_id)

        # Create or retrieve session
        if session_id is None:
            session_id = uuid4()
            session = ChatSession(
                id=session_id,
                user_id=user_id,
                title=content[:50] + ("..." if len(content) > 50 else ""),
            )
            self.db.add(session)
            await self.db.flush()
        else:
            result = await self.db.execute(
                select(ChatSession).where(
                    ChatSession.id == session_id,
                    ChatSession.user_id == user_id,
                )
            )
            session = result.scalars().first()
            if session is None:
                raise NotFoundException("ChatSession", str(session_id))

        # Load history and context
        history = await self._load_history(user_id, session_id)
        user, profile, recent_logs = await self._get_user_context(user_id)
        context_block = self._build_context_block(user, profile, recent_logs)

        messages = [
            {"role": "system", "content": DETAILED_SYSTEM_PROMPT},
            {"role": "system", "content": f"Here is the user's current context:\n{context_block}"},
        ]
        for msg in history[-20:]:
            messages.append({"role": msg.role.value, "content": msg.content})
        messages.append({"role": "user", "content": content})

        # Persist user message
        user_msg = ChatMessage(
            id=uuid4(),
            session_id=session_id,
            user_id=user_id,
            role=ChatRole.USER,
            content=content,
        )
        self.db.add(user_msg)
        await self.db.flush()

        try:
            client = await self._get_http_client()
            payload = {
                "model": settings.DEEPSEEK_MODEL,
                "messages": messages,
                "max_tokens": settings.DEEPSEEK_MAX_TOKENS,
                "temperature": settings.DEEPSEEK_TEMPERATURE,
                "stream": True,
                "user": str(user_id),
            }

            full_content = ""
            async with client.stream("POST", "/chat/completions", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            chunk_data = json.loads(data_str)
                            delta = chunk_data.get("choices", [{}])[0].get("delta", {})
                            if "content" in delta:
                                content_chunk = delta["content"]
                                full_content += content_chunk
                                yield {
                                    "type": "chunk",
                                    "content": content_chunk,
                                    "session_id": str(session_id),
                                }
                        except json.JSONDecodeError:
                            continue

            # Persist AI response
            ai_msg = ChatMessage(
                id=uuid4(),
                session_id=session_id,
                user_id=user_id,
                role=ChatRole.ASSISTANT,
                content=full_content,
            )
            self.db.add(ai_msg)
            session.updated_at = datetime.now(timezone.utc)
            await self.db.flush()

            yield {
                "type": "done",
                "session_id": str(session_id),
                "message_id": str(ai_msg.id),
            }

        except httpx.HTTPStatusError as e:
            yield {
                "type": "error",
                "detail": f"DeepSeek API error: {e.response.status_code}",
                "code": "EXTERNAL_API_ERROR",
            }
        except httpx.TimeoutException:
            yield {
                "type": "error",
                "detail": "DeepSeek API timed out",
                "code": "EXTERNAL_API_ERROR",
            }
        except Exception as e:
            yield {
                "type": "error",
                "detail": f"Failed to get AI response: {str(e)}",
                "code": "EXTERNAL_API_ERROR",
            }
        finally:
            await self.redis.delete(f"chat:session:{session_id}:messages")

    async def get_conversation_history(
        self,
        user_id: UUID,
        session_id: UUID,
        limit: int = 50,
        before: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        # Verify session belongs to user
        result = await self.db.execute(
            select(ChatSession).where(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id,
            )
        )
        session = result.scalars().first()
        if session is None:
            raise NotFoundException("ChatSession", str(session_id))

        query = (
            select(ChatMessage)
            .where(
                ChatMessage.session_id == session_id,
                ChatMessage.user_id == user_id,
            )
        )

        if before:
            query = query.where(ChatMessage.created_at < before)

        query = query.order_by(ChatMessage.created_at.desc()).limit(limit)

        result = await self.db.execute(query)
        messages = list(reversed(result.scalars().all()))

        # Count total
        count_stmt = select(func.count(ChatMessage.id)).where(
            ChatMessage.session_id == session_id,
            ChatMessage.user_id == user_id,
        )
        total = (await self.db.execute(count_stmt)).scalar_one()

        return {
            "session_id": session_id,
            "title": session.title,
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role.value,
                    "content": msg.content,
                    "metadata": msg.metadata,
                    "created_at": msg.created_at,
                }
                for msg in messages
            ],
            "total_count": total,
        }

    async def delete_conversation(self, user_id: UUID, session_id: UUID) -> None:
        result = await self.db.execute(
            select(ChatSession).where(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id,
            )
        )
        session = result.scalars().first()
        if session is None:
            raise NotFoundException("ChatSession", str(session_id))

        await self.db.delete(session)
        await self.db.flush()
        await self.redis.delete(f"chat:session:{session_id}:messages")

    async def list_sessions(self, user_id: UUID, limit: int = 20) -> List[Dict[str, Any]]:
        result = await self.db.execute(
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())
            .limit(limit)
        )
        sessions = result.scalars().all()

        sessions_data = []
        for session in sessions:
            count_result = await self.db.execute(
                select(func.count(ChatMessage.id)).where(
                    ChatMessage.session_id == session.id
                )
            )
            msg_count = count_result.scalar_one()

            sessions_data.append({
                "id": session.id,
                "title": session.title,
                "message_count": msg_count,
                "created_at": session.created_at,
                "updated_at": session.updated_at,
            })

        return sessions_data
