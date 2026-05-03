from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: Optional[str] = None
    role: str
    is_active: bool
    suggestions_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    age: Optional[int] = Field(None, ge=1, le=150)
    height_cm: Optional[float] = Field(None, gt=0, le=300)
    weight_kg: Optional[float] = Field(None, gt=0, le=500)
    dietary_preference: Optional[str] = None
    fitness_goal: Optional[str] = None
    activity_level: Optional[str] = None
    allergies: Optional[List[str]] = None
    cuisine_preference: Optional[str] = None
    target_weight_kg: Optional[float] = Field(None, gt=0, le=500)
    target_date: Optional[date] = None
    workout_days_per_week: Optional[int] = Field(None, ge=1, le=7)
    daily_calorie_target: Optional[int] = Field(None, ge=0)
    daily_protein_target_g: Optional[int] = Field(None, ge=0)
    daily_water_glasses: Optional[int] = Field(None, ge=0)
    suggestions_enabled: Optional[bool] = None


class UserProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    age: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    dietary_preference: Optional[str] = None
    fitness_goal: Optional[str] = None
    activity_level: Optional[str] = None
    allergies: List[str] = []
    cuisine_preference: Optional[str] = None
    target_weight_kg: Optional[float] = None
    target_date: Optional[date] = None
    workout_days_per_week: int = 3
    daily_calorie_target: int = 2000
    daily_protein_target_g: int = 50
    daily_water_glasses: int = 8
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPreferencesResponse(BaseModel):
    dietary_preference: Optional[str] = None
    fitness_goal: Optional[str] = None
    activity_level: Optional[str] = None
    suggestions_enabled: bool = True
    allergies: List[str] = []
    cuisine_preference: Optional[str] = None
    daily_calorie_target: int = 2000
    daily_protein_target_g: int = 50
    daily_water_glasses: int = 8
    workout_days_per_week: int = 3
