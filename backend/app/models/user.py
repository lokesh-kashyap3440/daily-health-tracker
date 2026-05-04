import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class DietaryPreference(str, enum.Enum):
    VEGETARIAN = "vegetarian"
    NON_VEGETARIAN = "non_vegetarian"
    VEGAN = "vegan"
    KETO = "keto"
    PALEO = "paleo"
    MEDITERRANEAN = "mediterranean"


class FitnessGoal(str, enum.Enum):
    WEIGHT_LOSS = "weight_loss"
    MUSCLE_GAIN = "muscle_gain"
    MAINTENANCE = "maintenance"
    ENDURANCE = "endurance"
    FLEXIBILITY = "flexibility"


class ActivityLevel(str, enum.Enum):
    SEDENTARY = "sedentary"
    LIGHTLY_ACTIVE = "lightly_active"
    MODERATELY_ACTIVE = "moderately_active"
    VERY_ACTIVE = "very_active"
    EXTREMELY_ACTIVE = "extremely_active"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    role = Column(String(20), default="user")
    is_active = Column(Boolean, default=True)
    suggestions_enabled = Column(Boolean, default=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    profile = relationship(
        "UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    refresh_tokens = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    daily_logs = relationship(
        "DailyLog", back_populates="user", cascade="all, delete-orphan"
    )
    chat_sessions = relationship(
        "ChatSession", back_populates="user", cascade="all, delete-orphan"
    )
    chat_messages = relationship(
        "ChatMessage", back_populates="user", cascade="all, delete-orphan"
    )
    suggestions = relationship(
        "DailySuggestion", back_populates="user", cascade="all, delete-orphan"
    )
    health_goals = relationship(
        "HealthGoal", back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def full_name(self) -> str:
        if self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    age = Column(Integer, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    dietary_preference = Column(
        Enum(DietaryPreference, name="dietary_preference", create_type=False, values_callable=lambda x: [e.value for e in x]),
        default=DietaryPreference.NON_VEGETARIAN.value,
    )
    fitness_goal = Column(
        Enum(FitnessGoal, name="fitness_goal", create_type=False, values_callable=lambda x: [e.value for e in x]),
        default=FitnessGoal.MAINTENANCE.value,
    )
    activity_level = Column(
        Enum(ActivityLevel, name="activity_level", create_type=False, values_callable=lambda x: [e.value for e in x]),
        default=ActivityLevel.MODERATELY_ACTIVE.value,
    )
    allergies = Column(ARRAY(String), default=[])
    cuisine_preference = Column(String(100), nullable=True)
    target_weight_kg = Column(Float, nullable=True)
    target_date = Column(Date, nullable=True)
    workout_days_per_week = Column(Integer, default=3)
    daily_calorie_target = Column(Integer, default=2000)
    daily_protein_target_g = Column(Integer, default=50)
    daily_water_glasses = Column(Integer, default=8)
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
        CheckConstraint("age > 0 AND age < 150", name="ck_profile_age"),
        CheckConstraint("height_cm > 0", name="ck_profile_height"),
        CheckConstraint("weight_kg > 0", name="ck_profile_weight"),
        CheckConstraint(
            "workout_days_per_week BETWEEN 1 AND 7", name="ck_workout_days"
        ),
    )

    # Relationships
    user = relationship("User", back_populates="profile")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    jti = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
