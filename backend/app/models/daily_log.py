import uuid

from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class DailyLog(Base):
    __tablename__ = "daily_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    log_date = Column(Date, nullable=False)
    water_glasses = Column(Integer, default=0)
    sleep_hours = Column(Float, default=0.0)
    sleep_quality = Column(Integer, default=0)
    mood_rating = Column(Integer, default=3)
    weight_kg = Column(Float, nullable=True)
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
        UniqueConstraint("user_id", "log_date", name="uq_user_log_date"),
        CheckConstraint("mood_rating >= 1 AND mood_rating <= 5", name="ck_mood_rating"),
        CheckConstraint("water_glasses >= 0", name="ck_water_glasses"),
        CheckConstraint("sleep_hours >= 0 AND sleep_hours <= 24", name="ck_sleep_hours"),
        CheckConstraint("sleep_quality >= 0 AND sleep_quality <= 5", name="ck_sleep_quality"),
        # Composite index for common query pattern
        __import__("sqlalchemy").Index(
            "ix_daily_logs_user_date", "user_id", "log_date"
        ),
    )

    # Relationships
    user = relationship("User", back_populates="daily_logs")
    meals = relationship(
        "Meal", back_populates="daily_log", cascade="all, delete-orphan"
    )
    workouts = relationship(
        "Workout", back_populates="daily_log", cascade="all, delete-orphan"
    )
