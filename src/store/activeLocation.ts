import { z } from 'zod';

const KEY = 'weather:activeLocation:v1';
const EVENT = 'weather:activeLocation';

export const ActiveLocationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('geo') }),
  z.object({ kind: z.literal('city'), cityId: z.string() }),
  z.object({ kind: z.literal('fallback') }),
]);

export type ActiveLocation = z.infer<typeof ActiveLocationSchema>;

const DEFAULT_LOCATION: ActiveLocation = { kind: 'fallback' };

function safeRead(): ActiveLocation {
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_LOCATION;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return ActiveLocationSchema.parse(parsed);
  } catch {
    return DEFAULT_LOCATION;
  }
}

export function getActiveLocation(): ActiveLocation {
  return safeRead();
}

export function setActiveLocation(loc: ActiveLocation) {
  localStorage.setItem(KEY, JSON.stringify(loc));
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeActiveLocation(cb: () => void) {
  const onLocal = () => cb();
  window.addEventListener(EVENT, onLocal);

  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener(EVENT, onLocal);
    window.removeEventListener('storage', onStorage);
  };
}
