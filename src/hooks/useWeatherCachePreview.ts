import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { WeatherSnapshot } from '../api/schemas';

export type Preview = {
  temp?: number;
  condition?: string;
  isDay?: boolean;
  alertsCount?: number;
  updatedAt?: number;
  dailyHighs?: number[];
  dailyLows?: number[];
};

function isExpired(expires?: number) {
  if (!expires) return false;
  return expires <= Date.now();
}

export function useWeatherCachePreview() {
  const qc = useQueryClient();

  // Pull any cached weather snapshots
  const entries = qc.getQueriesData<WeatherSnapshot>({ queryKey: ['weather'] });

  return useMemo(() => {
    // Map by placeName (your saved-city fetch passes a label like "City, ST, US")
    const map = new Map<string, Preview>();

    for (const [, data] of entries) {
      if (!data) continue;

      const alertsCount =
        data.alerts?.filter((a) => !isExpired(a.expires)).length ?? 0;

      const dailyHighs = (data.daily ?? [])
        .slice(0, 7)
        .map((d) => d.tempHigh)
        .filter(
          (n): n is number => typeof n === 'number' && Number.isFinite(n),
        );

      const dailyLows = (data.daily ?? [])
        .slice(0, 7)
        .map((d) => d.tempLow)
        .filter(
          (n): n is number => typeof n === 'number' && Number.isFinite(n),
        );

      map.set(data.placeName, {
        temp: data.current?.temp,
        condition: data.current?.condition,
        isDay: data.current?.isDay,
        alertsCount,
        updatedAt: data.updatedAt,
        dailyHighs: dailyHighs.length ? dailyHighs : undefined,
        dailyLows: dailyLows.length ? dailyLows : undefined,
      });
    }

    return map;
  }, [entries]);
}
