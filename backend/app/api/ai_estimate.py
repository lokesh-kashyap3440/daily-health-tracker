from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.ai_estimate import AIEstimateRequest, AIEstimateResponse
from app.services.ai_estimate_service import AIEstimateService

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/estimate", response_model=AIEstimateResponse)
async def ai_estimate(
    request: AIEstimateRequest,
    current_user: User = Depends(get_current_user),
):
    """Use AI to estimate nutritional info for a meal or calories for a workout."""
    service = AIEstimateService()

    if request.item_type == "meal":
        result = await service.estimate_meal(
            name=request.name,
            meal_type=request.meal_type,
        )
    else:
        result = await service.estimate_workout(
            name=request.name,
            duration_min=request.duration_min or 30,
            intensity=request.intensity,
        )

    if "error" in result:
        return AIEstimateResponse(calories=None, rationale=result["error"])

    return AIEstimateResponse(
        calories=result.get("calories"),
        protein_g=result.get("protein_g"),
        carbs_g=result.get("carbs_g"),
        fat_g=result.get("fat_g"),
        rationale=result.get("rationale"),
    )
