import type { WeatherData } from '../types/garden';

/**
 * Open-Meteo Geocoding Search result
 */
export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country: string;
  admin1?: string; // state/region
}

/**
 * Searches for coordinates and timezone of a city name using Open-Meteo's free Geocoding API.
 */
export async function searchCity(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return [];
  
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Geocoding API error');
    
    const data = await response.json();
    if (!data.results) return [];
    
    return data.results.map((item: any) => ({
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone || 'UTC',
      country: item.country,
      admin1: item.admin1
    }));
  } catch (error) {
    console.error('Error fetching geocoding data:', error);
    return [];
  }
}

/**
 * Maps standard WMO Weather Codes to user-friendly strings.
 */
export function getWeatherConditionText(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code >= 1 && code <= 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code >= 56 && code <= 57) return 'Freezing Drizzle';
  if (code >= 61 && code <= 65) return 'Rainy';
  if (code >= 66 && code <= 67) return 'Freezing Rain';
  if (code >= 71 && code <= 75) return 'Snowy';
  if (code === 77) return 'Snow Grains';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Unknown Conditions';
}

/**
 * Fetches the current weather for a specific latitude and longitude.
 */
export async function fetchCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=precipitation_probability_max&forecast_days=1&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API error');
    
    const data = await response.json();
    const current = data.current;
    const daily = data.daily;
    
    return {
      temp: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m),
      conditionCode: current.weather_code,
      conditionText: getWeatherConditionText(current.weather_code),
      windSpeed: Math.round(current.wind_speed_10m),
      precipitationProbability: daily && daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Fallback static weather if API fails
    return {
      temp: 22,
      humidity: 60,
      conditionCode: 1,
      conditionText: 'Partly Cloudy (Simulated)',
      windSpeed: 8,
      precipitationProbability: 10
    };
  }
}
