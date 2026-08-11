import env from '../../config/env.js';

export const executeWeather = async (userQuery) => {
  // Extract potential city name from query
  const cityMatch = userQuery.match(/in\s+([A-Za-z\s]+)/i) || userQuery.match(/weather\s+([A-Za-z\s]+)/i);
  const location = cityMatch ? cityMatch[1].trim() : 'Mumbai';

  if (env.OPENWEATHER_API_KEY) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${env.OPENWEATHER_API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          tool: 'weather',
          location: data.name,
          country: data.sys.country,
          temperature: `${data.main.temp}°C`,
          feelsLike: `${data.main.feels_like}°C`,
          condition: data.weather[0]?.description,
          humidity: `${data.main.humidity}%`
        };
      }
    } catch (err) {
      console.warn('Weather API call failed:', err.message);
    }
  }

  // Realistic mock weather fallback if API key is not configured
  return {
    success: true,
    tool: 'weather',
    isMock: true,
    location,
    temperature: '28°C',
    feelsLike: '30°C',
    condition: 'Partly Cloudy',
    humidity: '65%',
    windSpeed: '12 km/h'
  };
};

export default executeWeather;
