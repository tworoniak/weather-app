import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import type { Coords } from '../api/schemas';

const KEY = 'weather:activeLocation:v1';

const CoordsSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

const ActiveLocationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('fallback') }),
  z.object({ kind: z.literal('geo') }),
  z.object({ kind: z.literal('city'), cityId: z.string() }),
  z.object({
    kind: z.literal('recent'),
    coords: CoordsSchema,
    label: z.string(),
  }),
]);

export type ActiveLocation = z.infer<typeof ActiveLocationSchema>;

function safeRead(): ActiveLocation {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { kind: 'fallback' };

  try {
    const parsed = JSON.parse(raw);
    return ActiveLocationSchema.parse(parsed);
  } catch {
    return { kind: 'fallback' };
  }
}

function save(next: ActiveLocation) {
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('weather:activeLocation'));
}

export function useActiveLocation() {
  const [active, setActiveState] = useState<ActiveLocation>(() => safeRead());

  useEffect(() => {
    const onLocal = () => setActiveState(safeRead());
    window.addEventListener('weather:activeLocation', onLocal);

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setActiveState(safeRead());
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('weather:activeLocation', onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setActive = useCallback((next: ActiveLocation) => {
    setActiveState(next);
    save(next);
  }, []);

  // Convenience helpers (optional)
  const setFallback = useCallback(
    () => setActive({ kind: 'fallback' }),
    [setActive],
  );
  const setGeo = useCallback(() => setActive({ kind: 'geo' }), [setActive]);
  const setCity = useCallback(
    (cityId: string) => setActive({ kind: 'city', cityId }),
    [setActive],
  );
  const setRecent = useCallback(
    (coords: Coords, label: string) =>
      setActive({ kind: 'recent', coords, label }),
    [setActive],
  );

  return {
    active,
    setActive,
    setFallback,
    setGeo,
    setCity,
    setRecent,
  } as const;
}
