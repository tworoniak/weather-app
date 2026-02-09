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
  addedAt: z.number(),
});

export type SavedCity = z.infer<typeof SavedCitySchema>;

export const SavedCitiesSchema = z.array(SavedCitySchema);

// Weather data shape here is intentionally “provider-agnostic”.
export const WeatherSnapshotSchema = z.object({
  placeName: z.string(),
  updatedAt: z.number(),
  current: z.object({
    temp: z.number(),
    feelsLike: z.number().optional(),
    wind: z.number().optional(),
    humidity: z.number().optional(),
    condition: z.string(), // "Clear", "Rain", etc
    isDay: z.boolean().optional(),
  }),
  daily: z.array(
    z.object({
      date: z.string(), // ISO date
      tempHigh: z.number(),
      tempLow: z.number(),
      precipChance: z.number().optional(), // 0-100
      condition: z.string(),
    }),
  ),
  alerts: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        severity: z.string().optional(),
        startsAt: z.number().optional(),
        endsAt: z.number().optional(),
        area: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>;
