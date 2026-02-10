import { api } from './client';
import type { Coords, WeatherSnapshot } from './schemas';
import { WeatherSnapshotSchema } from './schemas';
import { getSavedCityById } from '../store/savedCities';

type OpenMeteoForecast = {
  timezone?: string;
  utc_offset_seconds?: number;

  current?: {
    time: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    is_day?: number; // 1 day, 0 night
    weather_code?: number;
  };

  daily?: {
    time: string[]; // yyyy-mm-dd
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: (number | null)[];
    weather_code?: (number | null)[];
    sunrise?: string[];
    sunset?: string[];
  };
};

function weatherCodeToCondition(code: number | null | undefined): string {
  if (code == null) return 'Unknown';

  // WMO code groupings per Open-Meteo docs
  if (code === 0) return 'Clear';
  if (code === 1 || code === 2 || code === 3) return 'Clouds';
  if (code === 45 || code === 48) return 'Fog';
  if (code === 51 || code === 53 || code === 55) return 'Drizzle';
  if (code === 56 || code === 57) return 'Freezing Drizzle';
  if (code === 61 || code === 63 || code === 65) return 'Rain';
  if (code === 66 || code === 67) return 'Freezing Rain';
  if (code === 71 || code === 73 || code === 75) return 'Snow';
  if (code === 77) return 'Snow Grains';
  if (code === 80 || code === 81 || code === 82) return 'Showers';
  if (code === 85 || code === 86) return 'Snow Showers';
  if (code === 95) return 'Thunderstorm';
  if (code === 96 || code === 99) return 'Thunderstorm';
  return 'Unknown';
}

export async function fetchWeatherByCoords(
  coords: Coords,
): Promise<WeatherSnapshot> {
  const res = await api.get<OpenMeteoForecast>('/v1/forecast', {
    params: {
      latitude: coords.lat,
      longitude: coords.lon,

      current: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'wind_speed_10m',
        'is_day',
        'weather_code',
      ].join(','),

      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
        'weather_code',
        'sunrise',
        'sunset',
      ].join(','),

      forecast_days: 7,
      timezone: 'auto',

      // US-friendly defaults (change later via settings toggle)
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      precipitation_unit: 'inch',
    },
  });

  const data = res.data;

  const currentTemp = data.current?.temperature_2m ?? 0;
  const currentFeels = data.current?.apparent_temperature;
  const currentHumidity = data.current?.relative_humidity_2m;
  const currentWind = data.current?.wind_speed_10m;
  const currentIsDay = data.current?.is_day === 1;
  const currentCode = data.current?.weather_code ?? null;

  const dailyTimes = data.daily?.time ?? [];
  const highs = data.daily?.temperature_2m_max ?? [];
  const lows = data.daily?.temperature_2m_min ?? [];
  const precip = data.daily?.precipitation_probability_max ?? [];
  const dailyCodes = data.daily?.weather_code ?? [];

  const snapshot: WeatherSnapshot = {
    placeName: `Lat ${coords.lat.toFixed(2)}, Lon ${coords.lon.toFixed(2)}`,
    updatedAt: Date.now(),
    current: {
      temp: currentTemp,
      feelsLike: currentFeels,
      wind: currentWind,
      humidity: currentHumidity,
      condition: weatherCodeToCondition(currentCode),
      isDay: currentIsDay,
    },
    daily: dailyTimes.slice(0, 7).map((date, i) => ({
      date,
      tempHigh: highs[i] ?? currentTemp,
      tempLow: lows[i] ?? currentTemp,
      precipChance: precip[i] ?? undefined,
      condition: weatherCodeToCondition(dailyCodes[i] ?? null),
    })),
    alerts: undefined,
  };

  return WeatherSnapshotSchema.parse(snapshot);
}

export async function fetchWeatherByCity(
  cityId: string,
): Promise<WeatherSnapshot> {
  const city = getSavedCityById(cityId);

  if (!city) {
    throw new Error('City not found in saved cities.');
  }

  return fetchWeatherByCoords({ lat: city.lat, lon: city.lon });
}
