from datetime import date, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, get_redis_client
from app.core.exceptions import NotFoundException
from app.core.redis import RedisClient
from app.models.user import User
from app.services.metrics_service import MetricsService

router = APIRouter(prefix="/metrics", tags=["metrics"])


def get_metrics_service(
    db: AsyncSession = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client),
) -> MetricsService:
    return MetricsService(db=db, redis=redis)


@router.get("/weight")
async def get_weight_history(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    metrics_service: MetricsService = Depends(get_metrics_service),
):
    """Get weight history for the specified number of days."""
    records = await metrics_service.get_weight_history(current_user.id, days)
    return {"records": records}


@router.get("/bmi")
async def get_bmi_history(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    metrics_service: MetricsService = Depends(get_metrics_service),
):
    """Get BMI history for the specified number of days."""
    records = await metrics_service.get_bmi_history(current_user.id, days)
    return {"records": records}


@router.post("/weight", status_code=201)
async def record_weight(
    weight_kg: float = Query(..., gt=0, le=500),
    record_date: date = Query(default_factory=date.today),
    notes: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    metrics_service: MetricsService = Depends(get_metrics_service),
):
    """Record a new weight entry."""
    result = await metrics_service.record_weight(
        user_id=current_user.id,
        weight_kg=weight_kg,
        record_date=record_date,
        notes=notes,
    )
    return result


@router.get("/summary")
async def get_metrics_summary(
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    metrics_service: MetricsService = Depends(get_metrics_service),
):
    """Get aggregated metrics summary for a date range."""
    if end is None:
        end = date.today()
    if start is None:
        start = end - timedelta(days=7)

    summary = await metrics_service.get_metrics_summary(
        user_id=current_user.id,
        start_date=start,
        end_date=end,
    )
    return summary


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    metrics_service: MetricsService = Depends(get_metrics_service),
):
    """Get dashboard summary data."""
    summary = await metrics_service.get_dashboard_summary(current_user.id)
    return summary
