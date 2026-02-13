import { z } from 'zod';
import type { SavedCity } from '../api/schemas';

const KEY = 'weather:recentSearches:v1';
const MAX = 8;

const RecentSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    region: z.string().optional(),
    country: z.string(),
    lat: z.number(),
    lon: z.number(),
    addedAt: z.number(),
  }),
);

type RecentCity = SavedCity & { addedAt: number };

function safeRead(): RecentCity[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return RecentSchema.parse(parsed);
  } catch {
    return [];
  }
}

function save(items: RecentCity[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('weather:recentSearches'));
}

export function getRecentSearches(): RecentCity[] {
  return safeRead();
}

export function addRecentSearch(city: SavedCity) {
  const existing = safeRead();

  const withAddedAt: RecentCity = {
    ...city,
    addedAt: Date.now(),
  };

  // remove duplicates
  const filtered = existing.filter((c) => c.id !== city.id);

  save([withAddedAt, ...filtered].slice(0, MAX));
}

export function clearRecentSearches() {
  save([]);
}
