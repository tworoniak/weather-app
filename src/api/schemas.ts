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

export type HourlyPoint = z.infer<typeof HourlyPointSchema>;

export const WeatherAlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown']),
  urgency: z.enum(['Immediate', 'Expected', 'Future', 'Past', 'Unknown']),
  certainty: z.enum(['Observed', 'Likely', 'Possible', 'Unlikely', 'Unknown']),
  areaDesc: z.string().optional(),
  headline: z.string().optional(),
  description: z.string().optional(),
  instruction: z.string().optional(),
  effective: z.number().optional(), // epoch ms
  expires: z.number().optional(), // epoch ms
  sender: z.string().optional(),
  link: z.string().optional(),
});

export type WeatherAlert = z.infer<typeof WeatherAlertSchema>;

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
  hourly: z.array(HourlyPointSchema).optional(),
  alerts: z.array(WeatherAlertSchema).optional(), // ✅ typed
});

export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>;
