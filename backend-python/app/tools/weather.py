import re
import urllib.parse
from typing import Dict, Any
import httpx

from app.core.config import settings
from app.core.logging import logger

async def execute_weather(user_query: str) -> Dict[str, Any]:
    """Execute live weather lookup via OpenWeatherMap API with simulated fallback."""
    try:
        if not user_query or not isinstance(user_query, str):
            return {
                "success": False,
                "tool": "weather",
                "error": "No location provided for weather lookup."
            }

        clean = user_query.strip()
        location = None

        patterns = [
            r'(?:weather|temperature|forecast|climate)\s+(?:in|for|at|of)\s+([A-Za-z\s\-]+)',
            r'(?:in|for|at)\s+([A-Za-z\s\-]+?)\s+(?:weather|temperature|forecast|climate)',
            r'^([A-Za-z\s\-]+?)\s+(?:weather|temperature|forecast|climate)',
            r'(?:what is the weather in|how is the weather in)\s+([A-Za-z\s\-]+)'
        ]

        for p in patterns:
            match = re.search(p, clean, re.IGNORECASE)
            if match and match.group(1):
                candidate = match.group(1).rstrip('?. ').strip()
                if candidate.lower() not in ('today', 'now', 'tomorrow', 'the', 'current'):
                    location = candidate
                    break

        location = location or "Mumbai"

        if settings.OPENWEATHER_API_KEY and settings.OPENWEATHER_API_KEY.strip():
            try:
                encoded_loc = urllib.parse.quote(location)
                url = f"https://api.openweathermap.org/data/2.5/weather?q={encoded_loc}&units=metric&appid={settings.OPENWEATHER_API_KEY}"
                async with httpx.AsyncClient(timeout=6.0) as client:
                    response = await client.get(url)
                    if response.status_code == 200:
                        data = response.json()
                        main = data.get("main", {})
                        wind = data.get("wind", {})
                        weather = data.get("weather", [{}])[0]
                        sys = data.get("sys", {})
                        temp = round(main.get("temp", 0))
                        feels_like = round(main.get("feels_like", 0))
                        wind_speed = round(wind.get("speed", 0) * 3.6)

                        return {
                            "success": True,
                            "tool": "weather",
                            "location": data.get("name") or location,
                            "country": sys.get("country", ""),
                            "temperature": f"{temp}°C",
                            "feelsLike": f"{feels_like}°C",
                            "condition": weather.get("description", "Clear").title(),
                            "humidity": f"{main.get('humidity', 0)}%",
                            "windSpeed": f"{wind_speed} km/h",
                            "isLive": True
                        }
                    elif response.status_code == 404:
                        return {
                            "success": False,
                            "tool": "weather",
                            "error": f'Location "{location}" could not be found by weather service.'
                        }
            except Exception as err:
                logger.warning(f"Live OpenWeather request failed: {err}")

        # Structured simulated fallback
        return {
            "success": True,
            "tool": "weather",
            "isLive": False,
            "note": "Simulated report (configure OPENWEATHER_API_KEY in backend/.env for live OpenWeather data)",
            "location": location,
            "temperature": "24°C",
            "feelsLike": "25°C",
            "condition": "Partly Cloudy",
            "humidity": "60%",
            "windSpeed": "12 km/h"
        }
    except Exception as error:
        return {
            "success": False,
            "tool": "weather",
            "error": f"Weather lookup failed: {str(error)}"
        }
