import uuid

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    daily_log_id = Column(
        UUID(as_uuid=True), ForeignKey("daily_logs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    exercise_type = Column(String(100), nullable=False)
    duration_min = Column(Integer, nullable=False)
    intensity = Column(String(20), default="moderate")
    calories_burned = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint("duration_min > 0", name="ck_duration_min"),
        CheckConstraint("calories_burned >= 0", name="ck_calories_burned"),
    )

    # Relationships
    daily_log = relationship("DailyLog", back_populates="workouts")
