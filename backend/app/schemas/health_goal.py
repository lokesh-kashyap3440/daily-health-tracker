from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HealthGoalCreate(BaseModel):
    goal_type: str = Field(..., pattern="^(weight|calories|protein|water|sleep|workout_frequency)$")
    target_value: float = Field(..., gt=0)
    current_value: float = Field(default=0.0, ge=0)
    unit: str = Field(..., min_length=1, max_length=50)
    start_date: date = Field(default_factory=date.today)
    target_date: Optional[date] = None


class HealthGoalUpdate(BaseModel):
    target_value: Optional[float] = Field(None, gt=0)
    current_value: Optional[float] = Field(None, ge=0)
    target_date: Optional[date] = None
    is_active: Optional[bool] = None


class HealthGoalResponse(BaseModel):
    id: UUID
    user_id: UUID
    goal_type: str
    target_value: float
    current_value: float
    unit: str
    start_date: date
    target_date: Optional[date] = None
    is_active: bool
    achieved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
