import type { WeatherAlert } from '../api/schemas';

export function severityRank(sev: WeatherAlert['severity']): number {
  switch (sev) {
    case 'Extreme': return 0;
    case 'Severe':  return 1;
    case 'Moderate': return 2;
    case 'Minor':   return 3;
    default:        return 4;
  }
}

export function formatTime(ts?: number): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  return d.toLocaleString([], {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeUntil(ts?: number): string | null {
  if (!ts) return null;
  const ms = ts - Date.now();
  if (!Number.isFinite(ms)) return null;
  if (ms <= 0) return 'Expired';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h <= 0 ? `${m}m` : `${h}h ${m}m`;
}

export function stripLongWhitespace(s: string): string {
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

export function isExpired(expires?: number): boolean {
  if (!expires) return false;
  return expires <= Date.now();
}
