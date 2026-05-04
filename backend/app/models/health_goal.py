import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class GoalType(str, enum.Enum):
    WEIGHT = "weight"
    CALORIES = "calories"
    PROTEIN = "protein"
    WATER = "water"
    SLEEP = "sleep"
    WORKOUT_FREQUENCY = "workout_frequency"


class HealthGoal(Base):
    __tablename__ = "health_goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    goal_type = Column(Enum(GoalType, name="goal_type", create_type=False, values_callable=lambda x: [e.value for e in x]), nullable=False)
    target_value = Column(Float, nullable=False)
    current_value = Column(Float, default=0.0)
    unit = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False, server_default=func.current_date())
    target_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    achieved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_goals_user_active", "user_id", "is_active"),
    )

    # Relationships
    user = relationship("User", back_populates="health_goals")
