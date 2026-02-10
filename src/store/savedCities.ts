import { SavedCitiesSchema, type SavedCity } from '../api/schemas';

const KEY = 'weather:savedCities:v1';

function safeRead(): SavedCity[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return SavedCitiesSchema.parse(parsed);
  } catch {
    return [];
  }
}

export function getSavedCities(): SavedCity[] {
  return safeRead();
}

export function getSavedCityById(id: string): SavedCity | undefined {
  return safeRead().find((c) => c.id === id);
}

export function saveCities(cities: SavedCity[]) {
  localStorage.setItem(KEY, JSON.stringify(cities));
}

export function addCity(city: SavedCity) {
  const existing = safeRead();
  if (existing.some((c) => c.id === city.id)) return;

  const withAddedAt: SavedCity = {
    ...city,
    addedAt: city.addedAt ?? Date.now(),
  };

  saveCities(
    [withAddedAt, ...existing].sort(
      (a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0),
    ),
  );
}

export function removeCity(id: string) {
  const existing = safeRead();
  saveCities(existing.filter((c) => c.id !== id));
}
