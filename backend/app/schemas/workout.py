from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WorkoutCreate(BaseModel):
    daily_log_id: UUID
    exercise_type: str = Field(..., min_length=1, max_length=100)
    duration_min: int = Field(..., gt=0, le=1440)
    intensity: str = Field(default="moderate", pattern="^(low|moderate|high)$")
    calories_burned: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None


class WorkoutUpdate(BaseModel):
    exercise_type: Optional[str] = Field(None, min_length=1, max_length=100)
    duration_min: Optional[int] = Field(None, gt=0, le=1440)
    intensity: Optional[str] = Field(None, pattern="^(low|moderate|high)$")
    calories_burned: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None


class WorkoutResponse(BaseModel):
    id: UUID
    daily_log_id: UUID
    user_id: UUID
    exercise_type: str
    duration_min: int
    intensity: str
    calories_burned: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
