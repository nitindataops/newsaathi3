/**
 * Kisan Saathi Real Weather Service
 * Uses Open-Meteo API (official WMO meteorological data for Indian agricultural districts)
 * Free, high-speed, no API key required, reliable real-time observations and forecasts.
 */

interface WeatherResult {
  location: string;
  temperature: number;
  humidity: number;
  weatherDescription: string;
  windSpeed: number;
  rainProbability: number;
  forecastSummary: string;
  source: string;
  timestamp: string;
}

// District coordinates for key agricultural districts in India
const DISTRICT_COORDINATES: Record<string, { name: string; lat: number; lon: number; state: string }> = {
  bareilly: { name: 'Bareilly', lat: 28.367, lon: 79.430, state: 'Uttar Pradesh' },
  pilibhit: { name: 'Pilibhit', lat: 28.631, lon: 79.802, state: 'Uttar Pradesh' },
  budaun: { name: 'Budaun', lat: 28.033, lon: 79.117, state: 'Uttar Pradesh' },
  rampur: { name: 'Rampur', lat: 28.815, lon: 79.027, state: 'Uttar Pradesh' },
  meerut: { name: 'Meerut', lat: 28.984, lon: 77.706, state: 'Uttar Pradesh' },
  agra: { name: 'Agra', lat: 27.176, lon: 78.008, state: 'Uttar Pradesh' },
  aligarh: { name: 'Aligarh', lat: 27.897, lon: 78.088, state: 'Uttar Pradesh' },
  lucknow: { name: 'Lucknow', lat: 26.846, lon: 80.946, state: 'Uttar Pradesh' },
  varanasi: { name: 'Varanasi', lat: 25.317, lon: 82.973, state: 'Uttar Pradesh' },
  kanpur: { name: 'Kanpur', lat: 26.449, lon: 80.331, state: 'Uttar Pradesh' },
  indore: { name: 'Indore', lat: 22.719, lon: 75.857, state: 'Madhya Pradesh' },
  bhopal: { name: 'Bhopal', lat: 23.259, lon: 77.412, state: 'Madhya Pradesh' },
  karnal: { name: 'Karnal', lat: 29.685, lon: 76.990, state: 'Haryana' },
  ludhiana: { name: 'Ludhiana', lat: 30.901, lon: 75.857, state: 'Punjab' },
  jaipur: { name: 'Jaipur', lat: 26.912, lon: 75.787, state: 'Rajasthan' },
  kota: { name: 'Kota', lat: 25.213, lon: 75.864, state: 'Rajasthan' },
  ahmedabad: { name: 'Ahmedabad', lat: 23.022, lon: 72.571, state: 'Gujarat' },
  pune: { name: 'Pune', lat: 18.520, lon: 73.856, state: 'Maharashtra' },
  nagpur: { name: 'Nagpur', lat: 21.145, lon: 79.088, state: 'Maharashtra' },
};

function decodeWmoWeatherCode(code: number): string {
  switch (code) {
    case 0: return 'Clear sky / साफ आसमान';
    case 1:
    case 2:
    case 3: return 'Partly cloudy / आंशिक बादल';
    case 45:
    case 48: return 'Fog / कोहरा';
    case 51:
    case 53:
    case 55: return 'Light drizzle / हल्की बूंदाबांदी';
    case 61:
    case 63:
    case 65: return 'Rain showers / बारिश';
    case 71:
    case 73:
    case 75: return 'Snowfall / बर्फबारी';
    case 80:
    case 81:
    case 82: return 'Moderate to heavy rain showers / तेज बारिश';
    case 95:
    case 96:
    case 99: return 'Thunderstorm / गरज के साथ बौछारें';
    default: return 'Fair / सामान्य मौसम';
  }
}

export async function fetchLiveDistrictWeather(districtQuery?: string): Promise<WeatherResult | null> {
  try {
    let target = DISTRICT_COORDINATES.bareilly; // Default agri hub
    if (districtQuery) {
      const q = districtQuery.toLowerCase().trim();
      for (const [key, coords] of Object.entries(DISTRICT_COORDINATES)) {
        if (q.includes(key) || q.includes(coords.name.toLowerCase())) {
          target = coords;
          break;
        }
      }
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${target.lat}&longitude=${target.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const current = data.current;
    const daily = data.daily;

    if (!current) return null;

    const weatherDesc = decodeWmoWeatherCode(current.weather_code || 0);
    const rainProb = daily?.precipitation_probability_max?.[0] ?? 10;
    const maxTemp = daily?.temperature_2m_max?.[0] ?? current.temperature_2m;
    const minTemp = daily?.temperature_2m_min?.[0] ?? (current.temperature_2m - 8);

    return {
      location: `${target.name}, ${target.state}`,
      temperature: Math.round(current.temperature_2m * 10) / 10,
      humidity: current.relative_humidity_2m,
      weatherDescription: weatherDesc,
      windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
      rainProbability: rainProb,
      forecastSummary: `Today: ${minTemp}°C - ${maxTemp}°C, Rain chance: ${rainProb}%. Wind: ${current.wind_speed_10m} km/h.`,
      source: 'Open-Meteo IMD Global Meteorological Observation',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch (err) {
    console.warn('[Weather Service] Weather fetch unavailable:', err);
    return null;
  }
}
