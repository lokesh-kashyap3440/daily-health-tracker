from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DailyLogCreate(BaseModel):
    log_date: date = Field(default_factory=date.today)
    water_glasses: int = Field(default=0, ge=0)
    sleep_hours: float = Field(default=0.0, ge=0, le=24)
    mood_rating: int = Field(default=3, ge=1, le=5)


class DailyLogUpdate(BaseModel):
    water_glasses: Optional[int] = Field(None, ge=0)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    sleep_quality: Optional[int] = Field(None, ge=1, le=5)
    mood_rating: Optional[int] = Field(None, ge=1, le=5)
    weight_kg: Optional[float] = Field(None, gt=0)


class UpdateWaterRequest(BaseModel):
    glasses: int = Field(..., ge=0)


class UpdateSleepRequest(BaseModel):
    hours: Optional[float] = Field(None, ge=0, le=24)
    quality: Optional[int] = Field(None, ge=1, le=5)


class UpdateMoodRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)


class MealSummary(BaseModel):
    id: UUID
    meal_type: str
    name: str
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class WorkoutSummary(BaseModel):
    id: UUID
    exercise_type: str
    duration_min: int
    intensity: str
    calories_burned: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class DailyLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    log_date: date
    water_glasses: int
    sleep_hours: float
    sleep_quality: int = 0
    mood_rating: int
    weight_kg: Optional[float] = None
    meals: List[MealSummary] = []
    workouts: List[WorkoutSummary] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
