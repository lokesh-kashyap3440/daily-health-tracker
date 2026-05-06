"""Tests for chatbot endpoints.

Covers:
    - POST /api/chat/send        (success with mocked DeepSeek API, missing message)
    - GET  /api/chat/sessions    (list user's sessions)
    - POST /api/chat/sessions    (create new session; routed via /api/chat/send
                                  with ``session_id=None``)
"""

from unittest.mock import AsyncMock, patch

from httpx import AsyncClient

from app.services.chatbot_service import ChatbotService

CHAT_URL = "/api/chat"
SEND_URL = f"{CHAT_URL}/send"
SESSIONS_URL = f"{CHAT_URL}/sessions"


class TestSendMessage:
    async def test_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        mock_deepseek_client: AsyncMock,
    ):
        """POST /api/chat/send returns 200 with an assistant response.

        The DeepSeek API call is replaced by ``mock_deepseek_client``.
        """
        with patch.object(
            ChatbotService, "_get_http_client", return_value=mock_deepseek_client
        ):
            resp = await client.post(
                SEND_URL,
                json={"content": "Give me a healthy breakfast idea."},
                headers=auth_headers,
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "assistant"
        assert "session_id" in data
        assert "message_id" in data
        assert data["content"] == "Here is some health advice."

    async def test_missing_content(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Empty content is rejected (422)."""
        resp = await client.post(
            SEND_URL,
            json={"content": ""},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    async def test_requires_auth(self, client: AsyncClient):
        """POST /api/chat/send without auth returns 401."""
        resp = await client.post(
            SEND_URL,
            json={"content": "Hello"},
        )
        assert resp.status_code == 401

    async def test_creates_new_session_on_first_message(
        self,
        client: AsyncClient,
        auth_headers: dict,
        mock_deepseek_client: AsyncMock,
    ):
        """Omitting ``session_id`` auto-creates a new session."""
        with patch.object(
            ChatbotService, "_get_http_client", return_value=mock_deepseek_client
        ):
            resp = await client.post(
                SEND_URL,
                json={"content": "Suggest a workout."},
                headers=auth_headers,
            )
        assert resp.status_code == 200
        assert resp.json()["session_id"] is not None


class TestListSessions:
    async def test_empty(self, client: AsyncClient, auth_headers: dict):
        """GET /api/chat/sessions returns [] when no sessions exist."""
        resp = await client.get(SESSIONS_URL, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_with_sessions(
        self,
        client: AsyncClient,
        auth_headers: dict,
        mock_deepseek_client: AsyncMock,
    ):
        """After sending a message, the session appears in the list."""
        with patch.object(
            ChatbotService, "_get_http_client", return_value=mock_deepseek_client
        ):
            await client.post(
                SEND_URL,
                json={"content": "Hello"},
                headers=auth_headers,
            )

        resp = await client.get(SESSIONS_URL, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert "title" in data[0]
        assert "message_count" in data[0]
