// import { api } from './client';
import type { Coords, WeatherSnapshot } from './schemas';
import { WeatherSnapshotSchema } from './schemas';

export async function fetchWeatherByCoords(
  coords: Coords,
): Promise<WeatherSnapshot> {
  const now = Date.now();

  const mock: WeatherSnapshot = {
    placeName: `Lat ${coords.lat.toFixed(2)}, Lon ${coords.lon.toFixed(2)}`,
    updatedAt: now,
    current: {
      temp: 42,
      feelsLike: 39,
      wind: 12,
      humidity: 55,
      condition: 'Clouds',
      isDay: true,
    },
    daily: Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now + i * 86400000);
      const iso = d.toISOString().slice(0, 10);

      return {
        date: iso,
        tempHigh: 45 + i,
        tempLow: 30 + i,
        precipChance: i % 2 === 0 ? 20 : 55,
        condition: i % 3 === 0 ? 'Rain' : 'Clouds',
      };
    }),
    alerts: [
      {
        id: 'demo-alert',
        title: 'Demo Alert: Wind Advisory',
        severity: 'Moderate',
        description:
          'This is placeholder alert data until you wire a provider.',
      },
    ],
  };

  return WeatherSnapshotSchema.parse(mock);
}

export async function fetchWeatherByCity(
  cityId: string,
): Promise<WeatherSnapshot> {
  const coords = { lat: 39.0997, lon: -94.5786 };
  return fetchWeatherByCoords(coords);
  console.log(cityId);
}
