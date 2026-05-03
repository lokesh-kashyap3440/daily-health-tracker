from datetime import date, datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SuggestionResponse(BaseModel):
    id: UUID
    user_id: UUID
    suggestion_date: date
    category: str
    title: str
    content: str
    is_dismissed: bool
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SuggestionListResponse(BaseModel):
    suggestions: List[SuggestionResponse]
    total: int
