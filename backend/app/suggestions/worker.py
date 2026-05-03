"""
RabbitMQ consumer worker for async suggestion generation.

Listens on the `suggestion.generate` queue and calls DeepSeek API
to generate personalized daily health suggestions. Stores results
in PostgreSQL and Redis cache.

Usage: python -m app.suggestions.worker
"""

import asyncio
import json
import logging
from datetime import date, timezone

from app.config import settings
from app.core.rabbitmq import rabbitmq_connection
from app.services.suggestion_service import SuggestionService
from app.database import async_session_factory

logger = logging.getLogger(__name__)


async def process_suggestion(message: dict) -> None:
    """Process a single suggestion generation request."""
    payload = message.get("payload", {})
    user_id = payload.get("user_id")
    suggestion_date = payload.get("date", str(date.today()))

    if not user_id:
        logger.error("Suggestion request missing user_id: %s", message)
        return

    async with async_session_factory() as db:
        try:
            from app.core.redis import get_redis
            redis = await get_redis()
            service = SuggestionService(db=db, redis=redis)
            suggestion = await service.generate_daily_suggestion(
                user_id=user_id,
                suggestion_date=date.fromisoformat(suggestion_date),
            )
            logger.info(
                "Generated suggestion for user=%s category=%s",
                user_id,
                suggestion.category if suggestion else "none",
            )
        except Exception:
            logger.exception("Failed to generate suggestion for user=%s", user_id)


async def main() -> None:
    """Connect to RabbitMQ and start consuming suggestion requests."""
    logger.info("Starting suggestion worker...")
    await rabbitmq_connection.connect()

    channel = await rabbitmq_connection.get_channel()
    await channel.set_qos(prefetch_count=1)

    queue = await channel.declare_queue("suggestion.generate", durable=True)
    await queue.bind("health.suggestions", routing_key="generate")

    async def on_message(message) -> None:
        async with message.process():
            body = json.loads(message.body)
            await process_suggestion(body)

    await queue.consume(on_message)
    logger.info("Suggestion worker listening on queue: suggestion.generate")

    try:
        await asyncio.Future()  # run forever
    except asyncio.CancelledError:
        logger.info("Suggestion worker shutting down")
        await rabbitmq_connection.close()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    asyncio.run(main())
