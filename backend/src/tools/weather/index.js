import env from '../../config/env.js';
import logger from '../../shared/logger.js';

export const executeWeather = async (userQuery) => {
  try {
    if (!userQuery || typeof userQuery !== 'string') {
      return {
        success: false,
        tool: 'weather',
        error: 'No location provided for weather lookup.'
      };
    }

    // Clean query
    const clean = userQuery.trim();

    // Comprehensive location extraction
    let location = null;

    const extractMatch =
      clean.match(/(?:weather|temperature|forecast|climate)\s+(?:in|for|at|of)\s+([A-Za-z\s\-]+)/i) ||
      clean.match(/(?:in|for|at)\s+([A-Za-z\s\-]+?)\s+(?:weather|temperature|forecast|climate)/i) ||
      clean.match(/^([A-Za-z\s\-]+?)\s+(?:weather|temperature|forecast|climate)/i) ||
      clean.match(/(?:what is the weather in|how is the weather in)\s+([A-Za-z\s\-]+)/i);

    if (extractMatch && extractMatch[1]) {
      const candidate = extractMatch[1].replace(/[\?\.]$/, '').trim();
      if (candidate && !['today', 'now', 'tomorrow', 'the', 'current'].includes(candidate.toLowerCase())) {
        location = candidate;
      }
    }

    location = location || 'Mumbai';

    if (env.OPENWEATHER_API_KEY && env.OPENWEATHER_API_KEY.trim() !== '') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${env.OPENWEATHER_API_KEY}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            tool: 'weather',
            location: data.name || location,
            country: data.sys?.country || '',
            temperature: `${Math.round(data.main.temp)}°C`,
            feelsLike: `${Math.round(data.main.feels_like)}°C`,
            condition: data.weather?.[0]?.description || 'Clear',
            humidity: `${data.main.humidity}%`,
            windSpeed: `${Math.round(data.wind?.speed * 3.6)} km/h`,
            isLive: true
          };
        } else if (response.status === 404) {
          return {
            success: false,
            tool: 'weather',
            error: `Location "${location}" could not be found by weather service.`
          };
        } else {
          logger.warn('WeatherTool', `OpenWeather returned status ${response.status}`);
        }
      } catch (err) {
        logger.warn('WeatherTool', 'Live OpenWeather API request failed:', { error: err.message, location });
      }
    }

    // Transparent structured fallback when API key is unconfigured or unavailable
    return {
      success: true,
      tool: 'weather',
      isLive: false,
      note: 'Simulated report (configure OPENWEATHER_API_KEY in backend/.env for live OpenWeather data)',
      location,
      temperature: '22°C',
      feelsLike: '23°C',
      condition: 'Partly Cloudy',
      humidity: '65%',
      windSpeed: '12 km/h'
    };
  } catch (error) {
    return {
      success: false,
      tool: 'weather',
      error: `Weather lookup failed: ${error.message}`
    };
  }
};

export default executeWeather;
