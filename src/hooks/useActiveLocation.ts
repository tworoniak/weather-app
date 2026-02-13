import { useEffect, useState } from 'react';
import type { ActiveLocation } from '../store/activeLocation';
import {
  getActiveLocation,
  setActiveLocation,
  subscribeActiveLocation,
} from '../store/activeLocation';

export function useActiveLocation() {
  const [active, setActive] = useState<ActiveLocation>(() =>
    getActiveLocation(),
  );

  useEffect(() => {
    return subscribeActiveLocation(() => setActive(getActiveLocation()));
  }, []);

  return {
    active,
    setActive: (loc: ActiveLocation) => setActiveLocation(loc),
  } as const;
}
