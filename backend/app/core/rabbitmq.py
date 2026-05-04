import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Optional

import aio_pika
from aio_pika.abc import AbstractRobustConnection, AbstractRobustChannel

from app.config import settings

logger = logging.getLogger(__name__)


class RabbitMQConnection:
    def __init__(self, rabbitmq_url: str):
        self.url = rabbitmq_url
        self._connection: Optional[AbstractRobustConnection] = None
        self._channel: Optional[AbstractRobustChannel] = None
        self.main_exchange: Optional[aio_pika.abc.AbstractExchange] = None

    async def connect(self) -> None:
        if not self.url:
            logger.info("RabbitMQ not configured — skipping connection")
            return
        self._connection = await aio_pika.connect_robust(self.url)
        self._channel = await self._connection.channel()
        await self._declare_topology()

    async def _declare_topology(self) -> None:
        # Main topic exchange
        self.main_exchange = await self._channel.declare_exchange(
            "health.events",
            aio_pika.ExchangeType.TOPIC,
            durable=True,
        )

        # Suggestion direct exchange
        self.suggestion_exchange = await self._channel.declare_exchange(
            "health.suggestions",
            aio_pika.ExchangeType.DIRECT,
            durable=True,
        )

        # Notification fanout exchange
        self.notification_exchange = await self._channel.declare_exchange(
            "health.notifications",
            aio_pika.ExchangeType.FANOUT,
            durable=True,
        )

        # DLX for dead letters
        self.dlx_exchange = await self._channel.declare_exchange(
            "health.dlx",
            aio_pika.ExchangeType.FANOUT,
            durable=True,
        )

        # Primary queues
        suggestion_queue = await self._channel.declare_queue(
            "suggestion.generate", durable=True
        )
        await suggestion_queue.bind(
            self.suggestion_exchange, routing_key="generate"
        )

        # Log event queues
        meal_queue = await self._channel.declare_queue(
            "meal.logged", durable=True
        )
        await meal_queue.bind(
            self.main_exchange, routing_key="meal.created"
        )
        await meal_queue.bind(
            self.main_exchange, routing_key="meal.updated"
        )
        await meal_queue.bind(
            self.main_exchange, routing_key="meal.deleted"
        )

        workout_queue = await self._channel.declare_queue(
            "workout.logged", durable=True
        )
        await workout_queue.bind(
            self.main_exchange, routing_key="workout.created"
        )
        await workout_queue.bind(
            self.main_exchange, routing_key="workout.updated"
        )
        await workout_queue.bind(
            self.main_exchange, routing_key="workout.deleted"
        )

        daily_log_queue = await self._channel.declare_queue(
            "daily_log.updated", durable=True
        )
        await daily_log_queue.bind(
            self.main_exchange, routing_key="log.updated"
        )

        # Dead letter queues
        dlq = await self._channel.declare_queue(
            "suggestion.generate.dlq", durable=True
        )
        await dlq.bind(self.dlx_exchange)

    async def publish(
        self,
        routing_key: str,
        data: dict[str, Any],
        exchange_name: str = "health.events",
    ) -> None:
        if not self.is_connected:
            logger.debug("RabbitMQ not connected — dropping event: %s", routing_key)
            return
        exchange = await self._channel.get_exchange(exchange_name)
        message = aio_pika.Message(
            body=json.dumps(
                {
                    "event_id": str(uuid.uuid4()),
                    "event_type": routing_key,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "data": data,
                }
            ).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            content_type="application/json",
        )
        await exchange.publish(message, routing_key=routing_key)

    async def publish_suggestion_request(
        self, user_id: str, log_date: str, context: Optional[dict] = None
    ) -> None:
        await self.publish(
            routing_key="generate",
            data={
                "user_id": user_id,
                "date": log_date,
                "context": context or {},
            },
            exchange_name="health.suggestions",
        )

    async def consume(
        self,
        queue_name: str,
        callback: Callable,
        prefetch_count: int = 1,
    ) -> None:
        if not self.is_connected:
            logger.warning("RabbitMQ not connected — cannot consume queue: %s", queue_name)
            return
        queue = await self._channel.declare_queue(queue_name, durable=True)
        await self._channel.set_qos(prefetch_count=prefetch_count)
        await queue.consume(callback)

    async def close(self) -> None:
        if self._channel:
            await self._channel.close()
        if self._connection:
            await self._connection.close()

    @property
    def is_connected(self) -> bool:
        return (
            self._connection is not None
            and not self._connection.is_closed
        )


rabbitmq_connection = RabbitMQConnection(settings.RABBITMQ_URL)


async def get_rabbitmq() -> RabbitMQConnection:
    return rabbitmq_connection
