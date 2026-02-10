import { useEffect, useState } from 'react';
import type { SavedCity } from '../api/schemas';
import {
  getSavedCities,
  SAVED_CITIES_EVENT_NAME,
  SAVED_CITIES_STORAGE_KEY,
} from '../store/savedCities';

export function useSavedCities() {
  const [cities, setCities] = useState<SavedCity[]>(() => getSavedCities());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refresh = () => setCities(getSavedCities());

    // Same-tab updates (our custom event)
    window.addEventListener(SAVED_CITIES_EVENT_NAME, refresh);

    // Cross-tab updates (native storage event)
    const onStorage = (e: StorageEvent) => {
      if (e.key === SAVED_CITIES_STORAGE_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener(SAVED_CITIES_EVENT_NAME, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return { cities, refresh: () => setCities(getSavedCities()) } as const;
}
