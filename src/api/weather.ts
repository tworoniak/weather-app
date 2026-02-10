import { api } from './client';
import type { Coords, WeatherSnapshot } from './schemas';
import { WeatherSnapshotSchema } from './schemas';
import { getSavedCityById } from '../store/savedCities';

type OpenMeteoForecast = {
  current?: {
    time: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    is_day?: number;
    weather_code?: number;
  };

  hourly?: {
    time: string[];
    temperature_2m?: (number | null)[];
    precipitation_probability?: (number | null)[];
    wind_speed_10m?: (number | null)[];
  };

  daily?: {
    time: string[];
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
  placeName?: string,
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

      hourly: [
        'temperature_2m',
        'precipitation_probability',
        'wind_speed_10m',
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

      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      precipitation_unit: 'inch',
    },
  });

  const data = res.data;

  const hourlyTimes = data.hourly?.time ?? [];
  const hourlyTemps = data.hourly?.temperature_2m ?? [];
  const hourlyPrecip = data.hourly?.precipitation_probability ?? [];
  const hourlyWind = data.hourly?.wind_speed_10m ?? [];

  // Keep just the next 48 hours for a clean chart
  const hourly = hourlyTimes.slice(0, 48).map((time, i) => ({
    time,
    temp: hourlyTemps[i] ?? undefined,
    precipChance: hourlyPrecip[i] ?? undefined,
    wind: hourlyWind[i] ?? undefined,
  }));

  const fallbackName = `Lat ${coords.lat.toFixed(2)}, Lon ${coords.lon.toFixed(2)}`;

  const snapshot: WeatherSnapshot = {
    placeName: placeName ?? fallbackName,
    updatedAt: Date.now(),
    current: {
      temp: data.current?.temperature_2m ?? 0,
      feelsLike: data.current?.apparent_temperature ?? undefined,
      wind: data.current?.wind_speed_10m ?? undefined,
      humidity: data.current?.relative_humidity_2m ?? undefined,
      condition: weatherCodeToCondition(data.current?.weather_code ?? null),
      isDay: data.current?.is_day === 1,
    },
    daily: (data.daily?.time ?? []).slice(0, 7).map((date, i) => ({
      date,
      tempHigh: (data.daily?.temperature_2m_max ?? [])[i] ?? 0,
      tempLow: (data.daily?.temperature_2m_min ?? [])[i] ?? 0,
      precipChance:
        (data.daily?.precipitation_probability_max ?? [])[i] ?? undefined,
      condition: weatherCodeToCondition(
        (data.daily?.weather_code ?? [])[i] ?? null,
      ),
    })),
    hourly,
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

  const label = `${city.name}${city.region ? `, ${city.region}` : ''}${
    city.country ? `, ${city.country}` : ''
  }`;

  return fetchWeatherByCoords({ lat: city.lat, lon: city.lon }, label);
}
