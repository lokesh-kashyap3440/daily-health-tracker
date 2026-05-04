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
    # Message envelope has {event_id, event_type, timestamp, data: {user_id, date, context}}
    payload = message.get("data", {})
    user_id = payload.get("user_id")

    if not user_id:
        logger.error("Suggestion request missing user_id: %s", message)
        return

    async with async_session_factory() as db:
        try:
            from app.core.redis import get_redis
            redis = await get_redis()
            service = SuggestionService(db=db, redis=redis)
            suggestion = await service.generate_suggestion(user_id=user_id)
            logger.info(
                "Generated suggestion for user=%s category=%s",
                user_id,
                suggestion.category.value if suggestion else "none",
            )
        except Exception:
            logger.exception("Failed to generate suggestion for user=%s", user_id)


async def main() -> None:
    """Connect to RabbitMQ and start consuming suggestion requests."""
    logger.info("Starting suggestion worker...")
    await rabbitmq_connection.connect()

    async def on_message(message) -> None:
        async with message.process():
            body = json.loads(message.body)
            await process_suggestion(body)

    await rabbitmq_connection.consume("suggestion.generate", on_message)
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
