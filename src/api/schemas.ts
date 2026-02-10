import { z } from 'zod';

export const CoordsSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export type Coords = z.infer<typeof CoordsSchema>;

export const SavedCitySchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.string().optional(),
  country: z.string(),
  lat: z.number(),
  lon: z.number(),
  addedAt: z.number().optional(),
});

export type SavedCity = z.infer<typeof SavedCitySchema>;

export const SavedCitiesSchema = z.array(SavedCitySchema);

// Weather data shape here is intentionally “provider-agnostic”.
export const HourlyPointSchema = z.object({
  time: z.string(), // ISO timestamp
  temp: z.number().optional(),
  precipChance: z.number().optional(), // 0-100
  wind: z.number().optional(), // mph
});

export const WeatherSnapshotSchema = z.object({
  placeName: z.string(),
  updatedAt: z.number(),
  current: z.object({
    temp: z.number(),
    feelsLike: z.number().optional(),
    wind: z.number().optional(),
    humidity: z.number().optional(),
    condition: z.string(),
    isDay: z.boolean(),
  }),
  daily: z.array(
    z.object({
      date: z.string(),
      tempHigh: z.number(),
      tempLow: z.number(),
      precipChance: z.number().optional(),
      condition: z.string(),
    }),
  ),
  hourly: z.array(HourlyPointSchema).optional(), // ✅ NEW
  alerts: z.any().optional(), // keep as-is for now if you already have it typed
});

export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>;
export type HourlyPoint = z.infer<typeof HourlyPointSchema>;
