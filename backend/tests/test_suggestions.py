"""Tests for suggestion endpoints.

Covers:
    - GET  /api/suggestions/today        (no suggestion → 404, cached suggestion returned)
    - POST /api/suggestions/refresh      (triggers generation via mocked DeepSeek)
"""

from unittest.mock import AsyncMock, patch

from httpx import AsyncClient

from app.models.suggestion import DailySuggestion, SuggestionCategory
from app.services.suggestion_service import SuggestionService

SUGGESTIONS_URL = "/api/suggestions"


class TestGetTodaySuggestion:
    async def test_no_suggestion(self, client: AsyncClient, auth_headers: dict):
        """GET /api/suggestions/today when no suggestion exists returns 404."""
        resp = await client.get(
            f"{SUGGESTIONS_URL}/today", headers=auth_headers
        )
        assert resp.status_code == 404

    async def test_returns_cached_suggestion(
        self, client: AsyncClient, auth_headers: dict, db_session, test_user
    ):
        """When a suggestion exists for today, it is returned."""
        from datetime import date, datetime, timezone

        s = DailySuggestion(
            id=__import__("uuid").uuid4(),
            user_id=test_user.id,
            suggestion_date=date.today(),
            category=SuggestionCategory.DIET,
            title="Eat More Greens",
            content="Try adding a serving of leafy greens to your lunch today.",
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(s)
        await db_session.flush()

        resp = await client.get(
            f"{SUGGESTIONS_URL}/today", headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Eat More Greens"
        assert data["category"] == "diet"
        assert data["is_dismissed"] is False


class TestRegenerateSuggestion:
    async def test_triggers_new_generation(
        self,
        client: AsyncClient,
        auth_headers: dict,
        mock_deepseek_client: AsyncMock,
    ):
        """POST /api/suggestions/refresh calls DeepSeek and returns new data."""
        with patch.object(
            SuggestionService, "_get_http_client", return_value=mock_deepseek_client
        ):
            resp = await client.post(
                f"{SUGGESTIONS_URL}/refresh", headers=auth_headers
            )
        assert resp.status_code == 200
        data = resp.json()
        # The suggestion service parses the mock JSON response. Since the mocked
        # AI response ("Here is some health advice.") is NOT valid JSON, the
        # service falls back to the raw content as the suggestion content.
        assert data["content"] is not None
        assert data["title"] is not None
        assert data["category"] is not None
