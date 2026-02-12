import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { WeatherSnapshot } from '../api/schemas';

function isExpired(expires?: number) {
  if (!expires) return false;
  return expires <= Date.now();
}

export function useActiveAlertsCount() {
  const qc = useQueryClient();

  // Pull any cached "weather" query results from react-query
  const queries = qc.getQueriesData<WeatherSnapshot>({
    queryKey: ['weather'],
  });

  const count = useMemo(() => {
    let total = 0;

    for (const [, data] of queries) {
      if (!data?.alerts) continue;

      total += data.alerts.filter((a) => !isExpired(a.expires)).length;
    }

    return total;
  }, [queries]);

  return count;
}
