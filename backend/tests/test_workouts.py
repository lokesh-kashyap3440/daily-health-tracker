"""Tests for workout endpoints.

Covers:
    - POST   /api/workouts       (create workout with all fields)
    - GET    /api/workouts       (filter by date, empty list)
    - PUT    /api/workouts/{id}  (update workout fields)
    - DELETE /api/workouts/{id}  (own workout, cannot delete others')
"""

from datetime import date, timedelta

from httpx import AsyncClient

WORKOUTS_URL = "/api/workouts"
TODAY = date.today().isoformat()


class TestCreateWorkout:
    async def test_with_all_fields(
        self, client: AsyncClient, auth_headers: dict, daily_log
    ):
        """A fully-populated workout returns 201 with every field echoed."""
        payload = {
            "daily_log_id": str(daily_log.id),
            "exercise_type": "Running",
            "duration_min": 30,
            "intensity": "high",
            "calories_burned": 350,
            "notes": "Morning run in the park",
        }
        resp = await client.post(WORKOUTS_URL, json=payload, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["exercise_type"] == "Running"
        assert data["duration_min"] == 30
        assert data["intensity"] == "high"
        assert data["calories_burned"] == 350
        assert data["notes"] == "Morning run in the park"
        assert data["daily_log_id"] == str(daily_log.id)

    async def test_default_intensity(
        self, client: AsyncClient, auth_headers: dict, daily_log
    ):
        """Leaving out ``intensity`` defaults to ``"moderate"``."""
        resp = await client.post(
            WORKOUTS_URL,
            json={
                "daily_log_id": str(daily_log.id),
                "exercise_type": "Walking",
                "duration_min": 20,
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.json()["intensity"] == "moderate"

    async def test_requires_auth(self, client: AsyncClient, daily_log):
        """POST without auth returns 401."""
        resp = await client.post(
            WORKOUTS_URL,
            json={
                "daily_log_id": str(daily_log.id),
                "exercise_type": "Yoga",
                "duration_min": 15,
            },
        )
        assert resp.status_code == 401


class TestGetWorkouts:
    async def test_empty_list(self, client: AsyncClient, auth_headers: dict):
        """GET /api/workouts with no data returns []."""
        resp = await client.get(WORKOUTS_URL, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_filter_by_date(
        self,
        client: AsyncClient,
        auth_headers: dict,
        daily_log,
        db_session,
        test_user,
    ):
        """GET /api/workouts?start=&end= returns workouts in that window."""
        from app.models.workout import Workout

        w = Workout(
            id=__import__("uuid").uuid4(),
            daily_log_id=daily_log.id,
            user_id=test_user.id,
            exercise_type="Swimming",
            duration_min=45,
        )
        db_session.add(w)
        await db_session.flush()

        start = (date.today() - timedelta(days=1)).isoformat()
        end = (date.today() + timedelta(days=1)).isoformat()
        resp = await client.get(
            f"{WORKOUTS_URL}?start={start}&end={end}",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["exercise_type"] == "Swimming"


class TestUpdateWorkout:
    async def test_update_fields(
        self, client: AsyncClient, auth_headers: dict, workout
    ):
        """PUT /api/workouts/{id} with partial data updates supplied fields."""
        resp = await client.put(
            f"{WORKOUTS_URL}/{workout.id}",
            json={"duration_min": 45, "calories_burned": 400},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["duration_min"] == 45
        assert data["calories_burned"] == 400
        # Unchanged field
        assert data["exercise_type"] == "Running"

    async def test_update_nonexistent(
        self, client: AsyncClient, auth_headers: dict
    ):
        """PUT for a non-existent workout returns 404."""
        bogus_id = "00000000-0000-0000-0000-000000000000"
        resp = await client.put(
            f"{WORKOUTS_URL}/{bogus_id}",
            json={"duration_min": 30},
            headers=auth_headers,
        )
        assert resp.status_code == 404


class TestDeleteWorkout:
    async def test_delete_own(
        self, client: AsyncClient, auth_headers: dict, workout
    ):
        """DELETE /api/workouts/{id} removes the user's own workout (204)."""
        resp = await client.delete(
            f"{WORKOUTS_URL}/{workout.id}", headers=auth_headers
        )
        assert resp.status_code == 204

        # Confirm gone
        get_resp = await client.get(WORKOUTS_URL, headers=auth_headers)
        ids = [w["id"] for w in get_resp.json()]
        assert str(workout.id) not in ids

    async def test_cannot_delete_others(
        self, client: AsyncClient, other_auth_headers: dict, workout
    ):
        """A user cannot delete another user's workout (403)."""
        resp = await client.delete(
            f"{WORKOUTS_URL}/{workout.id}", headers=other_auth_headers
        )
        assert resp.status_code == 403

    async def test_delete_nonexistent(
        self, client: AsyncClient, auth_headers: dict
    ):
        bogus_id = "00000000-0000-0000-0000-000000000000"
        resp = await client.delete(
            f"{WORKOUTS_URL}/{bogus_id}", headers=auth_headers
        )
        assert resp.status_code == 404
