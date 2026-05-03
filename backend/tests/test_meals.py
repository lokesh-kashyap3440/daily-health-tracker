"""Tests for meal endpoints.

Covers:
    - POST   /api/meals       (create meal with all fields)
    - GET    /api/meals       (filter by date, empty list)
    - PUT    /api/meals/{id}  (update meal fields)
    - DELETE /api/meals/{id}  (own meal, cannot delete others')
"""

from datetime import date, timedelta

import pytest
from httpx import AsyncClient

MEALS_URL = "/api/meals"
TODAY = date.today().isoformat()


class TestCreateMeal:
    async def test_with_all_fields(
        self, client: AsyncClient, auth_headers: dict, daily_log
    ):
        """A fully-populated meal returns 201 with every field echoed."""
        payload = {
            "daily_log_id": str(daily_log.id),
            "meal_type": "breakfast",
            "name": "Oatmeal with Berries",
            "description": "Steel-cut oats topped with blueberries.",
            "calories": 350,
            "protein_g": 12.0,
            "carbs_g": 45.0,
            "fat_g": 8.0,
            "serving_size": "1 bowl",
        }
        resp = await client.post(MEALS_URL, json=payload, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Oatmeal with Berries"
        assert data["calories"] == 350
        assert data["protein_g"] == 12.0
        assert data["carbs_g"] == 45.0
        assert data["fat_g"] == 8.0
        assert data["serving_size"] == "1 bowl"
        assert data["meal_type"] == "breakfast"
        assert data["daily_log_id"] == str(daily_log.id)

    async def test_requires_auth(self, client: AsyncClient, daily_log):
        """POST without authentication returns 401."""
        resp = await client.post(
            MEALS_URL,
            json={
                "daily_log_id": str(daily_log.id),
                "meal_type": "lunch",
                "name": "Salad",
            },
        )
        assert resp.status_code == 401


class TestGetMeals:
    async def test_empty_list(self, client: AsyncClient, auth_headers: dict):
        """GET /api/meals with no meals returns []."""
        resp = await client.get(MEALS_URL, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_filter_by_date(
        self, client: AsyncClient, auth_headers: dict, daily_log, db_session, test_user
    ):
        """GET /api/meals?start=&end= returns meals in that window."""
        # Create a meal on today
        from app.models.meal import Meal, MealType

        m = Meal(
            id=__import__("uuid").uuid4(),
            daily_log_id=daily_log.id,
            user_id=test_user.id,
            meal_type=MealType.LUNCH,
            name="Grilled Chicken Salad",
            calories=420,
        )
        db_session.add(m)
        await db_session.flush()

        start = (date.today() - timedelta(days=1)).isoformat()
        end = (date.today() + timedelta(days=1)).isoformat()
        resp = await client.get(
            f"{MEALS_URL}?start={start}&end={end}",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        names = [m["name"] for m in data]
        assert "Grilled Chicken Salad" in names


class TestUpdateMeal:
    async def test_update_fields(
        self, client: AsyncClient, auth_headers: dict, meal
    ):
        """PUT /api/meals/{id} with partial data updates only supplied fields."""
        resp = await client.put(
            f"{MEALS_URL}/{meal.id}",
            json={"calories": 450, "name": "Updated Oatmeal"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["calories"] == 450
        assert data["name"] == "Updated Oatmeal"
        # Unchanged fields should stay
        assert data["protein_g"] == 12.0

    async def test_update_nonexistent(
        self, client: AsyncClient, auth_headers: dict
    ):
        """PUT for a non-existent meal returns 404."""
        bogus_id = "00000000-0000-0000-0000-000000000000"
        resp = await client.put(
            f"{MEALS_URL}/{bogus_id}",
            json={"calories": 100},
            headers=auth_headers,
        )
        assert resp.status_code == 404


class TestDeleteMeal:
    async def test_delete_own_meal(
        self, client: AsyncClient, auth_headers: dict, meal
    ):
        """DELETE /api/meals/{id} removes the user's own meal (204)."""
        resp = await client.delete(
            f"{MEALS_URL}/{meal.id}", headers=auth_headers
        )
        assert resp.status_code == 204

        # Verify it's gone
        get_resp = await client.get(MEALS_URL, headers=auth_headers)
        ids = [m["id"] for m in get_resp.json()]
        assert str(meal.id) not in ids

    async def test_cannot_delete_others_meal(
        self, client: AsyncClient, auth_headers: dict, other_auth_headers: dict, meal
    ):
        """A user cannot delete another user's meal (403)."""
        resp = await client.delete(
            f"{MEALS_URL}/{meal.id}", headers=other_auth_headers
        )
        assert resp.status_code == 403

    async def test_delete_nonexistent(
        self, client: AsyncClient, auth_headers: dict
    ):
        """DELETE for a non-existent meal returns 404."""
        bogus_id = "00000000-0000-0000-0000-000000000000"
        resp = await client.delete(
            f"{MEALS_URL}/{bogus_id}", headers=auth_headers
        )
        assert resp.status_code == 404
