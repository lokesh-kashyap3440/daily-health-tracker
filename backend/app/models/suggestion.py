import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class SuggestionCategory(str, enum.Enum):
    DIET = "diet"
    WORKOUT = "workout"
    SLEEP = "sleep"
    HYDRATION = "hydration"
    GENERAL_WELLNESS = "general_wellness"


class DailySuggestion(Base):
    __tablename__ = "daily_suggestions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    suggestion_date = Column(Date, nullable=False)
    category = Column(Enum(SuggestionCategory), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    is_dismissed = Column(Boolean, default=False)
    metadata = Column(JSONB, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "suggestion_date", "category", name="uq_user_suggestion_date_cat"
        ),
    )

    # Relationships
    user = relationship("User", back_populates="suggestions")
