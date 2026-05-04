import json
import logging
from typing import Any, Optional

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._pool: Optional[aioredis.ConnectionPool] = None
        self.client: Optional[aioredis.Redis] = None

    async def initialize(self) -> None:
        if not self.redis_url:
            logger.info("Redis not configured — skipping initialization")
            return
        self._pool = aioredis.ConnectionPool.from_url(
            self.redis_url,
            max_connections=20,
            decode_responses=True,
        )
        self.client = aioredis.Redis(connection_pool=self._pool)

    async def close(self) -> None:
        if self.client:
            await self.client.aclose()
        if self._pool:
            await self._pool.disconnect()

    @property
    def _ready(self) -> bool:
        return self.client is not None

    async def ping(self) -> bool:
        if not self._ready:
            return False
        try:
            return await self.client.ping()
        except Exception:
            return False

    async def get(self, key: str) -> Optional[str]:
        if not self._ready:
            return None
        try:
            return await self.client.get(key)
        except Exception:
            return None

    async def set(self, key: str, value: str, ttl: Optional[int] = None) -> None:
        if not self._ready:
            return
        try:
            if ttl:
                await self.client.setex(key, ttl, value)
            else:
                await self.client.set(key, value)
        except Exception:
            pass

    async def set_json(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        serialized = json.dumps(value, default=str)
        await self.set(key, serialized, ttl)

    async def get_json(self, key: str) -> Optional[Any]:
        data = await self.get(key)
        if data is None:
            return None
        try:
            return json.loads(data)
        except (json.JSONDecodeError, TypeError):
            return None

    async def delete(self, key: str) -> None:
        if not self._ready:
            return
        try:
            await self.client.delete(key)
        except Exception:
            pass

    async def delete_pattern(self, pattern: str) -> None:
        if not self._ready:
            return
        try:
            cursor = 0
            while True:
                cursor, keys = await self.client.scan(
                    cursor=cursor, match=pattern, count=100
                )
                if keys:
                    await self.client.delete(*keys)
                if cursor == 0:
                    break
        except Exception:
            pass

    async def incr(self, key: str) -> int:
        if not self._ready:
            return 0
        try:
            return await self.client.incr(key)
        except Exception:
            return 0

    async def expire(self, key: str, seconds: int) -> None:
        if not self._ready:
            return
        try:
            await self.client.expire(key, seconds)
        except Exception:
            pass


redis_client = RedisClient(settings.REDIS_URL)


async def get_redis() -> RedisClient:
    return redis_client
