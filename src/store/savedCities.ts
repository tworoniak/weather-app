import { SavedCitiesSchema, type SavedCity } from '../api/schemas';

const KEY = 'weather:savedCities:v1';
const EVENT_NAME = 'weather:savedCities';

function safeRead(): SavedCity[] {
  // In case this file ever gets imported in a non-browser environment
  if (typeof window === 'undefined') return [];

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
  if (typeof window === 'undefined') return;

  localStorage.setItem(KEY, JSON.stringify(cities));
  window.dispatchEvent(new Event(EVENT_NAME));
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

export {
  KEY as SAVED_CITIES_STORAGE_KEY,
  EVENT_NAME as SAVED_CITIES_EVENT_NAME,
};
