"""Tests for daily-log endpoints.

Covers:
    - POST /api/daily-logs  (create new log, upsert by date)
    - GET  /api/daily-logs/today
    - GET  /api/daily-logs/date/{log_date}
    - PUT  /api/daily-logs/water  (update water glasses)
    - PUT  /api/daily-logs/sleep  (update sleep hours)
    - PUT  /api/daily-logs/mood   (update mood rating)
"""

from datetime import date, timedelta

from httpx import AsyncClient

DAILY_LOGS_URL = "/api/daily-logs"
TODAY = date.today().isoformat()


class TestCreateDailyLog:
    async def test_create_new_log(self, client: AsyncClient, auth_headers: dict):
        """POST a new daily-log entry returns 201 with the created fields."""
        payload = {
            "log_date": TODAY,
            "water_glasses": 8,
            "sleep_hours": 7.0,
            "mood_rating": 4,
        }
        resp = await client.post(DAILY_LOGS_URL, json=payload, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["water_glasses"] == 8
        assert data["sleep_hours"] == 7.0
        assert data["mood_rating"] == 4
        assert data["log_date"] == TODAY
        assert "id" in data
        assert data["meals"] == []
        assert data["workouts"] == []

    async def test_upsert_by_date(self, client: AsyncClient, auth_headers: dict):
        """POSTing to the same date updates (upserts) the existing log."""
        # Create initial log
        await client.post(
            DAILY_LOGS_URL,
            json={
                "log_date": TODAY,
                "water_glasses": 3,
                "sleep_hours": 6.0,
                "mood_rating": 2,
            },
            headers=auth_headers,
        )

        # Upsert with new values – note all schema fields have defaults so even
        # omitted ones are sent to ``update_daily_log`` with default values.
        upsert = await client.post(
            DAILY_LOGS_URL,
            json={
                "log_date": TODAY,
                "water_glasses": 8,
            },
            headers=auth_headers,
        )
        assert upsert.status_code == 201
        data = upsert.json()
        assert data["water_glasses"] == 8
        # Defaults from DailyLogCreate
        assert data["sleep_hours"] == 0.0
        assert data["mood_rating"] == 3

    async def test_unauthorized(self, client: AsyncClient):
        """POST without auth headers returns 401."""
        resp = await client.post(
            DAILY_LOGS_URL,
            json={"log_date": TODAY},
        )
        assert resp.status_code == 401


class TestGetDailyLog:
    async def test_get_today(self, client: AsyncClient, auth_headers: dict):
        """GET /api/daily-logs/today returns today's log (creates one if absent)."""
        resp = await client.get(f"{DAILY_LOGS_URL}/today", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["log_date"] == TODAY
        assert "water_glasses" in data

    async def test_get_by_date(self, client: AsyncClient, auth_headers: dict):
        """GET /api/daily-logs/date/<date> returns the log for that date."""
        # First ensure a log exists
        past = (date.today() - timedelta(days=1)).isoformat()
        await client.post(
            DAILY_LOGS_URL,
            json={"log_date": past, "water_glasses": 6},
            headers=auth_headers,
        )

        resp = await client.get(
            f"{DAILY_LOGS_URL}/date/{past}", headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["log_date"] == past
        assert data["water_glasses"] == 6

    async def test_get_by_date_not_found(
        self, client: AsyncClient, auth_headers: dict
    ):
        """A date with no log returns 404."""
        future = (date.today() + timedelta(days=365)).isoformat()
        resp = await client.get(
            f"{DAILY_LOGS_URL}/date/{future}", headers=auth_headers
        )
        assert resp.status_code == 404


class TestUpdateLogFields:
    async def test_update_water(self, client: AsyncClient, auth_headers: dict):
        """PUT /api/daily-logs/water updates the water-glasses field."""
        resp = await client.put(
            f"{DAILY_LOGS_URL}/water",
            json={"glasses": 10},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["water_glasses"] == 10

    async def test_update_sleep(self, client: AsyncClient, auth_headers: dict):
        """PUT /api/daily-logs/sleep updates the sleep-hours field."""
        resp = await client.put(
            f"{DAILY_LOGS_URL}/sleep",
            json={"hours": 8.5},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["sleep_hours"] == 8.5

    async def test_update_mood(self, client: AsyncClient, auth_headers: dict):
        """PUT /api/daily-logs/mood updates the mood-rating field."""
        resp = await client.put(
            f"{DAILY_LOGS_URL}/mood",
            json={"rating": 5},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["mood_rating"] == 5
