import axios from 'axios';
import { z } from 'zod';

const geocodeApi = axios.create({
  baseURL: 'https://geocoding-api.open-meteo.com',
  timeout: 15_000,
});

const GeoResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string().optional(),
  admin1: z.string().optional(), // state/region
});

const GeoResponseSchema = z.object({
  results: z.array(GeoResultSchema).optional(),
});

export type GeoResult = z.infer<typeof GeoResultSchema>;

export async function searchCities(q: string): Promise<GeoResult[]> {
  const res = await geocodeApi.get('/v1/search', {
    params: { name: q, count: 8, language: 'en', format: 'json' },
  });

  const parsed = GeoResponseSchema.parse(res.data);
  return parsed.results ?? [];
}
