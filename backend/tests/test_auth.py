"""Tests for authentication and user endpoints.

Covers:
    - POST /api/auth/register  (success, duplicate, missing fields, weak password)
    - POST /api/auth/login     (success, wrong password, non-existent user)
    - POST /api/auth/refresh   (valid token, invalid token)
    - GET  /api/users/me       (authenticated, unauthenticated)
"""

import pytest
from httpx import AsyncClient


class TestRegister:
    REGISTER_URL = "/api/auth/register"

    async def test_success(self, client: AsyncClient):
        """Register a valid new user returns 201 with user details."""
        payload = {
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "first_name": "Jane",
            "last_name": "Doe",
        }
        resp = await client.post(self.REGISTER_URL, json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "newuser@example.com"
        assert data["first_name"] == "Jane"
        assert data["last_name"] == "Doe"
        assert "user_id" in data
        assert "created_at" in data

    async def test_duplicate_email(self, client: AsyncClient, test_user):
        """Registering with an already-used email returns 409."""
        payload = {
            "email": test_user.email,
            "password": "strongpassword123",
            "first_name": "Dup",
        }
        resp = await client.post(self.REGISTER_URL, json=payload)
        assert resp.status_code == 409
        assert "already registered" in resp.json()["detail"].lower()

    @pytest.mark.parametrize(
        "payload, missing_field",
        [
            ({"password": "x", "first_name": "A"}, "email"),
            ({"email": "a@b.com", "first_name": "A"}, "password"),
            ({"email": "a@b.com", "password": "x"}, "first_name"),
        ],
    )
    async def test_missing_required_fields(
        self, client: AsyncClient, payload: dict, missing_field: str
    ):
        """Omitting required fields yields a 422 validation error."""
        resp = await client.post(self.REGISTER_URL, json=payload)
        assert resp.status_code == 422

    async def test_weak_password(self, client: AsyncClient):
        """A password shorter than 8 characters is rejected (422)."""
        payload = {
            "email": "weak@example.com",
            "password": "short",
            "first_name": "Weak",
        }
        resp = await client.post(self.REGISTER_URL, json=payload)
        assert resp.status_code == 422


class TestLogin:
    LOGIN_URL = "/api/auth/login"
    REGISTER_URL = "/api/auth/register"

    @pytest.fixture(autouse=True)
    async def _registered_user(self, client: AsyncClient):
        """Ensure a user exists in the DB before login tests."""
        await client.post(
            self.REGISTER_URL,
            json={
                "email": "login@example.com",
                "password": "correctpassword123",
                "first_name": "Login",
            },
        )

    async def test_success(self, client: AsyncClient):
        """Valid credentials return 200 with token data."""
        resp = await client.post(
            self.LOGIN_URL,
            json={"email": "login@example.com", "password": "correctpassword123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0

    async def test_wrong_password(self, client: AsyncClient):
        """Incorrect password returns 401."""
        resp = await client.post(
            self.LOGIN_URL,
            json={"email": "login@example.com", "password": "wrongpassword"},
        )
        assert resp.status_code == 401

    async def test_nonexistent_user(self, client: AsyncClient):
        """Login with an unknown email returns 401."""
        resp = await client.post(
            self.LOGIN_URL,
            json={"email": "noone@example.com", "password": "doesnotmatter"},
        )
        assert resp.status_code == 401


class TestRefreshToken:
    AUTH_URL = "/api/auth"
    REGISTER_URL = f"{AUTH_URL}/register"
    LOGIN_URL = f"{AUTH_URL}/login"
    REFRESH_URL = f"{AUTH_URL}/refresh"

    @pytest.fixture(autouse=True)
    async def _login_first(self, client: AsyncClient) -> dict:
        """Register + login so we have a real refresh token to work with."""
        await client.post(
            self.REGISTER_URL,
            json={
                "email": "refresh@example.com",
                "password": "password123",
                "first_name": "Refresh",
            },
        )
        resp = await client.post(
            self.LOGIN_URL,
            json={"email": "refresh@example.com", "password": "password123"},
        )
        self._tokens = resp.json()

    async def test_valid_token(self, client: AsyncClient):
        """Providing a valid refresh token returns a new token pair."""
        resp = await client.post(
            self.REFRESH_URL,
            json={"refresh_token": self._tokens["refresh_token"]},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_invalid_token(self, client: AsyncClient):
        """A garbage refresh token is rejected with 401."""
        resp = await client.post(
            self.REFRESH_URL,
            json={"refresh_token": "this.is.not.a.valid.token"},
        )
        assert resp.status_code == 401


class TestGetCurrentUser:
    USERS_ME_URL = "/api/users/me"

    async def test_authenticated(self, client: AsyncClient, auth_headers: dict):
        """An authenticated request returns the user's profile."""
        resp = await client.get(self.USERS_ME_URL, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "test@example.com"
        assert data["first_name"] == "Test"
        assert data["last_name"] == "User"

    async def test_unauthenticated(self, client: AsyncClient):
        """A request without a token returns 401."""
        resp = await client.get(self.USERS_ME_URL)
        assert resp.status_code == 401
