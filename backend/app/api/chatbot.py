import json
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, get_redis_client
from app.core.redis import RedisClient
from app.models.user import User
from app.schemas.chat import (
    ChatResponse,
    ChatSend,
    ChatSessionListItem,
    ChatSessionResponse,
)
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/chat", tags=["chat"])


def get_chatbot_service(
    db: AsyncSession = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client),
) -> ChatbotService:
    return ChatbotService(db=db, redis=redis)


@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatSend,
    current_user: User = Depends(get_current_user),
    chat_service: ChatbotService = Depends(get_chatbot_service),
):
    """Send a message to the AI chatbot and get a response."""
    result = await chat_service.send_message(
        user_id=current_user.id,
        session_id=request.session_id,
        content=request.content,
    )
    return ChatResponse(
        session_id=result["session_id"],
        message_id=result["message_id"],
        role=result["role"],
        content=result["content"],
        created_at=result["created_at"],
        metadata=result.get("metadata"),
    )


@router.post("/stream")
async def stream_message(
    request: ChatSend,
    current_user: User = Depends(get_current_user),
    chat_service: ChatbotService = Depends(get_chatbot_service),
):
    """Send a message to the AI chatbot and stream the response via SSE."""

    async def event_generator():
        async for event in chat_service.stream_message(
            user_id=current_user.id,
            session_id=request.session_id,
            content=request.content,
        ):
            if event["type"] == "chunk":
                yield f"data: {json.dumps(event)}\n\n"
            elif event["type"] == "done":
                yield f"data: {json.dumps(event)}\n\n"
                yield "data: [DONE]\n\n"
            elif event["type"] == "error":
                yield f"data: {json.dumps(event)}\n\n"
                yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history/{session_id}", response_model=ChatSessionResponse)
async def get_conversation_history(
    session_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    chat_service: ChatbotService = Depends(get_chatbot_service),
):
    """Get conversation history for a session."""
    result = await chat_service.get_conversation_history(
        user_id=current_user.id,
        session_id=session_id,
        limit=limit,
    )
    return ChatSessionResponse(
        id=result["session_id"],
        title=result["title"],
        messages=result["messages"],
        created_at=result.get("created_at"),
        updated_at=result.get("updated_at"),
    )


@router.get("/sessions", response_model=list)
async def list_sessions(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    chat_service: ChatbotService = Depends(get_chatbot_service),
):
    """List all chat sessions for the current user."""
    sessions = await chat_service.list_sessions(
        user_id=current_user.id,
        limit=limit,
    )
    return [
        ChatSessionListItem(
            id=s["id"],
            title=s["title"],
            message_count=s["message_count"],
            created_at=s["created_at"],
            updated_at=s["updated_at"],
        )
        for s in sessions
    ]


@router.delete("/history/{session_id}", status_code=204)
async def delete_conversation(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    chat_service: ChatbotService = Depends(get_chatbot_service),
):
    """Delete a conversation session and all its messages."""
    await chat_service.delete_conversation(
        user_id=current_user.id,
        session_id=session_id,
    )
    return None
