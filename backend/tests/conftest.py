"""
Test configuration for the Health Tracker API.

Handles:
- PostgreSQL type monkeypatching for SQLite compatibility
- Test database setup/teardown per session
- In-memory FakeRedis for caching
- Dependency overrides for FastAPI test client
- Factory fixtures for test data (users, daily logs, meals, workouts)
"""

import fnmatch
import json
import uuid
from datetime import date
from typing import Any, AsyncGenerator, Optional
from unittest.mock import AsyncMock, MagicMock

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import String, Text, TypeDecorator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# =============================================================================
# PostgreSQL type monkeypatching for SQLite
# MUST happen before any app module imports so that model-level `from
# sqlalchemy.dialects.postgresql import UUID` picks up the shim types.
# =============================================================================


class _UUID(TypeDecorator):
    """SQLite-compatible UUID type that stores UUIDs as 36-char strings."""

    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if isinstance(value, uuid.UUID):
            return str(value)
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)


class _JSON(TypeDecorator):
    """SQLite-compatible JSON type that serialises to/from text."""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value, default=str)
        return None

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return None


import sqlalchemy.dialects.postgresql as _pg  # noqa: E402

_pg.UUID = _UUID
_pg.ARRAY = lambda *args, **kwargs: Text()  # type: ignore[attr-defined]
_pg.JSONB = _JSON  # type: ignore[attr-defined]
_pg.JSON = _JSON  # type: ignore[attr-defined]

# =============================================================================
# Safe to import application code now
# =============================================================================

import app.database  # noqa: E402
from app.api.deps import get_db, get_redis_client  # noqa: E402
from app.core.security import create_access_token, hash_password  # noqa: E402
from app.database import Base  # noqa: E402
from app.main import app  # noqa: E402
from app.models.daily_log import DailyLog  # noqa: E402
from app.models.meal import Meal, MealType  # noqa: E402
from app.models.user import User, UserProfile  # noqa: E402
from app.models.workout import Workout  # noqa: E402

# =============================================================================
# Test database engine (in-memory SQLite)
# =============================================================================

TEST_DATABASE_URL = "sqlite+aiosqlite://"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionFactory = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


# =============================================================================
# Fake Redis – stores everything in a plain dict so tests never need a real
# Redis server.
# =============================================================================


class FakeRedis:
    """In-memory fake that implements every RedisClient method used by services."""

    def __init__(self):
        self._store: dict[str, Any] = {}
        self._ttls: dict[str, int] = {}

    async def initialize(self) -> None:
        pass

    async def close(self) -> None:
        pass

    async def ping(self) -> bool:
        return True

    async def get(self, key: str) -> Optional[str]:
        return self._store.get(key)

    async def set(self, key: str, value: str, ttl: Optional[int] = None) -> None:
        self._store[key] = value
        if ttl:
            self._ttls[key] = ttl

    async def set_json(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        await self.set(key, json.dumps(value, default=str), ttl)

    async def get_json(self, key: str) -> Optional[Any]:
        raw = await self.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return None

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)
        self._ttls.pop(key, None)

    async def delete_pattern(self, pattern: str) -> None:
        keys = [k for k in self._store if fnmatch.fnmatch(k, pattern)]
        for k in keys:
            self._store.pop(k, None)
            self._ttls.pop(k, None)

    async def incr(self, key: str) -> int:
        val = int(self._store.get(key, 0)) + 1
        self._store[key] = val
        return val

    async def expire(self, key: str, seconds: int) -> None:
        self._ttls[key] = seconds


_fake_redis = FakeRedis()

# =============================================================================
# Session-scoped database lifecycle
# =============================================================================


@pytest_asyncio.fixture(scope="session")
async def setup_database():
    """Create all tables once, drop them when the session ends."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# =============================================================================
# Function-scoped fixtures
# =============================================================================


@pytest_asyncio.fixture
async def db_session(setup_database) -> AsyncGenerator[AsyncSession, None]:
    """Provide a clean session per test (rolled back after the test)."""
    async with TestSessionFactory() as session:
        try:
            yield session
        finally:
            await session.rollback()


@pytest_asyncio.fixture
async def override_deps(db_session: AsyncSession):
    """Override FastAPI dependencies for the duration of one test.

    The overrides map ``get_db`` to our test session and ``get_redis_client`` to
    the ``FakeRedis`` instance so that services never touch a real database /
    Redis server.
    """

    async def _get_test_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    async def _get_test_redis():
        return _fake_redis

    app.dependency_overrides[get_db] = _get_test_db
    app.dependency_overrides[get_redis_client] = _get_test_redis
    yield
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(override_deps) -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client wired to the FastAPI app via ASGITransport.

    Dependencies (DB + Redis) are already overridden by ``override_deps``.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# =============================================================================
# User fixtures
# =============================================================================


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create and return a test user."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        password_hash=hash_password("testpassword123"),
        first_name="Test",
        last_name="User",
    )
    db_session.add(user)
    await db_session.flush()

    profile = UserProfile(user_id=user.id)
    db_session.add(profile)
    await db_session.flush()

    return user


@pytest_asyncio.fixture
async def second_user(db_session: AsyncSession) -> User:
    """A second user for permission / isolation tests."""
    user = User(
        id=uuid.uuid4(),
        email="other@example.com",
        password_hash=hash_password("otherpassword123"),
        first_name="Other",
        last_name="User",
    )
    db_session.add(user)
    await db_session.flush()

    profile = UserProfile(user_id=user.id)
    db_session.add(profile)
    await db_session.flush()

    return user


@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict[str, str]:
    """JWT auth headers (Bearer token) for the primary test user."""
    token = create_access_token(
        user_id=str(test_user.id),
        email=test_user.email,
        role=test_user.role,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def other_auth_headers(second_user: User) -> dict[str, str]:
    """JWT auth headers for the secondary user."""
    token = create_access_token(
        user_id=str(second_user.id),
        email=second_user.email,
        role=second_user.role,
    )
    return {"Authorization": f"Bearer {token}"}


# =============================================================================
# Data fixtures
# =============================================================================


@pytest_asyncio.fixture
async def daily_log(db_session: AsyncSession, test_user: User) -> DailyLog:
    """A daily log for the primary test user on today's date."""
    log = DailyLog(
        id=uuid.uuid4(),
        user_id=test_user.id,
        log_date=date.today(),
        water_glasses=5,
        sleep_hours=7.5,
        mood_rating=4,
    )
    db_session.add(log)
    await db_session.flush()
    await db_session.refresh(log)
    return log


@pytest_asyncio.fixture
async def meal(
    db_session: AsyncSession, test_user: User, daily_log: DailyLog
) -> Meal:
    """A sample meal linked to the fixture daily_log."""
    m = Meal(
        id=uuid.uuid4(),
        daily_log_id=daily_log.id,
        user_id=test_user.id,
        meal_type=MealType.BREAKFAST,
        name="Oatmeal",
        description="With berries and honey",
        calories=350,
        protein_g=12.0,
        carbs_g=45.0,
        fat_g=8.0,
    )
    db_session.add(m)
    await db_session.flush()
    await db_session.refresh(m)
    return m


@pytest_asyncio.fixture
async def workout(
    db_session: AsyncSession, test_user: User, daily_log: DailyLog
) -> Workout:
    """A sample workout linked to the fixture daily_log."""
    w = Workout(
        id=uuid.uuid4(),
        daily_log_id=daily_log.id,
        user_id=test_user.id,
        exercise_type="Running",
        duration_min=30,
        intensity="moderate",
        calories_burned=250,
        notes="Morning run in the park",
    )
    db_session.add(w)
    await db_session.flush()
    await db_session.refresh(w)
    return w


@pytest_asyncio.fixture
async def mock_deepseek_client() -> AsyncMock:
    """Return an ``AsyncMock`` that stands in for ``httpx.AsyncClient``.

    The returned mock's ``.post()`` method returns a response that mimics the
    DeepSeek ``/chat/completions`` endpoint so chatbot / suggestion tests can
    run without a real API key.
    """
    resp = MagicMock()
    resp.status_code = 200
    resp.json.return_value = {
        "choices": [{"message": {"content": "Here is some health advice."}}],
        "usage": {
            "prompt_tokens": 25,
            "completion_tokens": 42,
            "total_tokens": 67,
        },
        "model": "deepseek-chat",
    }

    client = AsyncMock()
    client.post = AsyncMock(return_value=resp)
    return client
