import { useEffect, useState } from 'react';
import type { SavedCity } from '../api/schemas';
import { getRecentSearches } from '../store/recentSearches';

export function useRecentSearches() {
  const [recent, setRecent] = useState<SavedCity[]>(() => getRecentSearches());

  useEffect(() => {
    const onLocalUpdate = () => setRecent(getRecentSearches());
    window.addEventListener('weather:recentSearches', onLocalUpdate);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'weather:recentSearches:v1') setRecent(getRecentSearches());
    };

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('weather:recentSearches', onLocalUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return {
    recent,
    refresh: () => setRecent(getRecentSearches()),
  } as const;
}
