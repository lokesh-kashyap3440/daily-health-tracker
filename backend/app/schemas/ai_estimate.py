from typing import Optional

from pydantic import BaseModel, Field


class AIEstimateRequest(BaseModel):
    item_type: str = Field(..., pattern="^(meal|workout)$")
    name: str = Field(..., min_length=1, max_length=200)
    meal_type: Optional[str] = Field(None, pattern="^(breakfast|lunch|dinner|snack)$")
    duration_min: Optional[int] = Field(None, gt=0, le=1440)
    intensity: Optional[str] = Field(None, pattern="^(low|moderate|high)$")


class AIEstimateResponse(BaseModel):
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    rationale: Optional[str] = None
