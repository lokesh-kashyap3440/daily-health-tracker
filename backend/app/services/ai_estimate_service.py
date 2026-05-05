import json
from typing import Optional

import httpx

from app.config import settings

ESTIMATE_SYSTEM_PROMPT = (
    "You are a nutrition and fitness data estimator. Given a food name or exercise description, "
    "return a JSON object with estimated nutritional values. Use reasonable standard portion sizes. "
    "Be as accurate as possible with your estimates.\n\n"
    "For meals, estimate based on standard restaurant/home-cooked portions:\n"
    "- Breakfast: ~300-600 calories typical\n"
    "- Lunch/Dinner: ~400-800 calories typical\n"
    "- Snack: ~100-300 calories typical\n\n"
    "For workouts, estimate calories burned based on:\n"
    "- Exercise type, duration, intensity\n"
    "- Low intensity: ~3-5 cal/min\n"
    "- Moderate intensity: ~5-8 cal/min\n"
    "- High intensity: ~8-12 cal/min\n\n"
    "Output ONLY valid JSON with no markdown fences or extra text."
)


class AIEstimateService:
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> Optional[httpx.AsyncClient]:
        if not settings.DEEPSEEK_API_KEY:
            return None
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url="https://api.deepseek.com/v1",
                headers={
                    "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=httpx.Timeout(settings.DEEPSEEK_TIMEOUT, connect=10),
            )
        return self._client

    async def estimate_meal(self, name: str, meal_type: Optional[str] = None) -> dict:
        """Estimate macros for a food item."""
        type_hint = f" ({meal_type})" if meal_type else ""
        prompt = (
            f"Estimate the nutritional content of '{name}'{type_hint} "
            f"for a standard serving. Return ONLY JSON with keys: "
            f"calories (int), protein_g (float), carbs_g (float), fat_g (float), "
            f"rationale (short string explaining the estimate)."
        )
        return await self._call_ai(prompt)

    async def estimate_workout(
        self, name: str, duration_min: int, intensity: Optional[str] = None
    ) -> dict:
        """Estimate calories burned for an exercise."""
        intensity_hint = f" at {intensity} intensity" if intensity else ""
        prompt = (
            f"Estimate calories burned for '{name}'{intensity_hint} for {duration_min} minutes. "
            f"Return ONLY JSON with keys: "
            f"calories (int), rationale (short string explaining the estimate). "
            f"Omit protein_g, carbs_g, fat_g."
        )
        return await self._call_ai(prompt)

    async def _call_ai(self, prompt: str) -> dict:
        client = await self._get_client()
        if client is None:
            return {"error": "AI API key not configured"}

        payload = {
            "model": settings.DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": ESTIMATE_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 300,
            "temperature": 0.3,
        }

        try:
            response = await client.post("/chat/completions", json=payload)
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]

            # Parse JSON from response — handle potential markdown fences
            content = content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[-1]
                content = content.rsplit("```", 1)[0]
            if content.startswith("json"):
                content = content[4:]

            return json.loads(content)

        except httpx.HTTPStatusError as e:
            return {"error": f"AI API error: {e.response.status_code}"}
        except httpx.TimeoutException:
            return {"error": "AI API timed out"}
        except (json.JSONDecodeError, KeyError) as e:
            return {"error": f"Failed to parse AI response: {str(e)}"}
        except Exception as e:
            return {"error": f"AI estimation failed: {str(e)}"}
