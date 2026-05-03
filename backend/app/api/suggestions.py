from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, get_redis_client
from app.core.exceptions import NotFoundException
from app.core.redis import RedisClient
from app.models.user import User
from app.schemas.suggestion import SuggestionListResponse, SuggestionResponse
from app.services.suggestion_service import SuggestionService

router = APIRouter(prefix="/suggestions", tags=["suggestions"])


def get_suggestion_service(
    db: AsyncSession = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client),
) -> SuggestionService:
    return SuggestionService(db=db, redis=redis)


@router.get("/today", response_model=SuggestionResponse)
async def get_today_suggestion(
    current_user: User = Depends(get_current_user),
    suggestion_service: SuggestionService = Depends(get_suggestion_service),
):
    """Get today's AI-generated suggestion."""
    suggestion = await suggestion_service.get_today_suggestion(current_user.id)
    if suggestion is None:
        raise NotFoundException("DailySuggestion", "today")
    return SuggestionResponse(
        id=suggestion.id,
        user_id=suggestion.user_id,
        suggestion_date=suggestion.suggestion_date,
        category=suggestion.category.value if hasattr(suggestion.category, 'value') else str(suggestion.category),
        title=suggestion.title,
        content=suggestion.content,
        is_dismissed=suggestion.is_dismissed,
        metadata=suggestion.metadata,
        created_at=suggestion.created_at,
    )


@router.get("", response_model=SuggestionListResponse)
async def get_recent_suggestions(
    limit: int = Query(10, ge=1, le=50),
    include_dismissed: bool = Query(False),
    current_user: User = Depends(get_current_user),
    suggestion_service: SuggestionService = Depends(get_suggestion_service),
):
    """Get recent AI-generated suggestions."""
    suggestions = await suggestion_service.get_recent_suggestions(
        user_id=current_user.id,
        limit=limit,
        include_dismissed=include_dismissed,
    )
    return SuggestionListResponse(
        suggestions=[
            SuggestionResponse(
                id=s.id,
                user_id=s.user_id,
                suggestion_date=s.suggestion_date,
                category=s.category.value if hasattr(s.category, 'value') else str(s.category),
                title=s.title,
                content=s.content,
                is_dismissed=s.is_dismissed,
                metadata=s.metadata,
                created_at=s.created_at,
            )
            for s in suggestions
        ],
        total=len(suggestions),
    )


@router.post("/refresh", response_model=SuggestionResponse)
async def refresh_suggestion(
    current_user: User = Depends(get_current_user),
    suggestion_service: SuggestionService = Depends(get_suggestion_service),
):
    """Request immediate refresh of today's suggestion."""
    suggestion = await suggestion_service.refresh_suggestion(current_user.id)
    return SuggestionResponse(
        id=suggestion.id,
        user_id=suggestion.user_id,
        suggestion_date=suggestion.suggestion_date,
        category=suggestion.category.value if hasattr(suggestion.category, 'value') else str(suggestion.category),
        title=suggestion.title,
        content=suggestion.content,
        is_dismissed=suggestion.is_dismissed,
        metadata=suggestion.metadata,
        created_at=suggestion.created_at,
    )


@router.put("/{suggestion_id}/dismiss", status_code=204)
async def dismiss_suggestion(
    suggestion_id: UUID,
    current_user: User = Depends(get_current_user),
    suggestion_service: SuggestionService = Depends(get_suggestion_service),
):
    """Dismiss a suggestion."""
    await suggestion_service.dismiss_suggestion(current_user.id, suggestion_id)
    return None
