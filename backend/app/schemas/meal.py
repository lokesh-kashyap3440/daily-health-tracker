from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MealCreate(BaseModel):
    daily_log_id: UUID
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    calories: Optional[int] = Field(None, ge=0)
    protein_g: Optional[float] = Field(None, ge=0)
    carbs_g: Optional[float] = Field(None, ge=0)
    fat_g: Optional[float] = Field(None, ge=0)
    serving_size: Optional[str] = None


class MealUpdate(BaseModel):
    meal_type: Optional[str] = Field(None, pattern="^(breakfast|lunch|dinner|snack)$")
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    calories: Optional[int] = Field(None, ge=0)
    protein_g: Optional[float] = Field(None, ge=0)
    carbs_g: Optional[float] = Field(None, ge=0)
    fat_g: Optional[float] = Field(None, ge=0)
    serving_size: Optional[str] = None


class MealResponse(BaseModel):
    id: UUID
    daily_log_id: UUID
    user_id: UUID
    meal_type: str
    name: str
    description: Optional[str] = None
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    serving_size: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
