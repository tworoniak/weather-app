import { useEffect, useMemo } from 'react';
import { X, MapPin, LocateFixed, Bookmark, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { useGeolocation } from '../hooks/useGeolocation';
import { useSavedCities } from '../hooks/useSavedCities';
import { useActiveLocation } from '../hooks/useActiveLocation';
import { useWeatherCachePreview } from '../hooks/useWeatherCachePreview';

import { fetchWeatherByCoords } from '../api/weather';
import type { Coords } from '../api/schemas';

type Props = {
  open: boolean;
  onClose: () => void;
};

function Sparkline({
  highs,
  lows,
  width = 78,
  height = 26,
}: {
  highs?: number[];
  lows?: number[];
  width?: number;
  height?: number;
}) {
  const hi = highs ?? [];
  const lo = lows ?? [];

  if (hi.length < 2 || lo.length < 2) return null;

  const all = [...hi, ...lo].filter((n) => Number.isFinite(n));
  if (all.length < 2) return null;

  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = Math.max(1e-6, max - min);

  const n = Math.max(hi.length, lo.length);

  const pad = 2;
  const w = width;
  const h = height;

  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const x = (i: number) => pad + (innerW * i) / Math.max(1, n - 1);
  const y = (v: number) => pad + innerH - ((v - min) / range) * innerH;

  const points = (arr: number[]) =>
    arr
      .slice(0, n)
      .map((v, i) => `${x(i)},${y(v)}`)
      .join(' ');

  const hiPts = points(hi);
  const loPts = points(lo);

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className='opacity-90'
      aria-hidden='true'
    >
      <rect
        x='0'
        y='0'
        width={w}
        height={h}
        rx='8'
        ry='8'
        fill='rgba(255,255,255,0.04)'
        stroke='rgba(255,255,255,0.08)'
      />

      <polyline
        points={hiPts}
        fill='none'
        stroke='#f97316'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />

      <polyline
        points={loPts}
        fill='none'
        stroke='#38bdf8'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function cityLabel(name: string, region?: string, country?: string) {
  return `${name}${region ? `, ${region}` : ''}${country ? `, ${country}` : ''}`;
}

function previewAge(updatedAt?: number) {
  if (!updatedAt) return null;
  const mins = Math.max(0, Math.round((Date.now() - updatedAt) / 60000));
  return mins <= 1 ? 'just now' : `${mins}m ago`;
}

export default function LocationPickerDrawer({ open, onClose }: Props) {
  const qc = useQueryClient();

  const { cities } = useSavedCities();
  const { active, setActive } = useActiveLocation();
  const previewMap = useWeatherCachePreview();

  const { state, request, canUse } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 30_000,
    maximumAge: 10 * 60_000,
  });

  // Close after GPS fix if user chose geo
  useEffect(() => {
    if (!open) return;
    if (active.kind !== 'geo') return;
    if (state.status === 'ready') onClose();
  }, [open, active.kind, state.status, onClose]);

  // ✅ Prefetch top 3 saved cities when drawer opens (so sparklines appear)
  useEffect(() => {
    if (!open) return;
    if (cities.length === 0) return;

    const top = cities.slice(0, 3);

    void Promise.all(
      top.map((c) => {
        const label = cityLabel(c.name, c.region, c.country);

        // If we already have preview data (temp/condition), skip prefetch
        const existing = previewMap.get(label);
        if (existing?.temp != null && existing?.condition)
          return Promise.resolve();

        const coords: Coords = { lat: c.lat, lon: c.lon };

        return qc.prefetchQuery({
          queryKey: ['weather', 'coords', coords.lat, coords.lon, label],
          queryFn: () => fetchWeatherByCoords(coords, label),
          staleTime: 10 * 60 * 1000,
        });
      }),
    );
    // intentionally depends on open/cities; previewMap read is OK
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cities, qc]);

  const activeCityId = active.kind === 'city' ? active.cityId : null;

  const activeCityLabel = useMemo(() => {
    if (!activeCityId) return null;
    const c = cities.find((x) => x.id === activeCityId);
    if (!c) return null;
    return cityLabel(c.name, c.region, c.country);
  }, [cities, activeCityId]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50'>
      <button
        type='button'
        className='absolute inset-0 bg-black/60'
        onClick={onClose}
        aria-label='Close location picker'
      />

      <div className='absolute right-0 top-0 h-full w-full max-w-md bg-slate-950/90 backdrop-blur-md ring-1 ring-white/10'>
        <div className='flex items-center justify-between px-5 py-4'>
          <div className='flex items-center gap-2'>
            <MapPin className='text-white/70' size={18} />
            <div className='text-sm font-semibold'>Choose location</div>
          </div>

          <button
            type='button'
            onClick={onClose}
            className='rounded-xl bg-white/10 p-2 hover:bg-white/15'
            aria-label='Close'
          >
            <X size={16} />
          </button>
        </div>

        <div className='space-y-4 px-5 pb-6'>
          <div className='rounded-3xl bg-white/5 p-4 ring-1 ring-white/10'>
            <div className='text-xs text-white/60'>Current</div>
            <div className='mt-1 text-sm font-semibold'>
              {active.kind === 'geo'
                ? 'Current location'
                : active.kind === 'city'
                  ? (activeCityLabel ?? 'Saved city')
                  : 'Fallback (Kansas City)'}
            </div>

            {active.kind === 'geo' && state.status === 'error' ? (
              <div className='mt-2 rounded-2xl bg-black/20 p-3 text-xs text-white/80 ring-1 ring-white/10'>
                {state.message}
              </div>
            ) : null}
          </div>

          <div className='grid gap-2'>
            <button
              type='button'
              onClick={() => {
                setActive({ kind: 'geo' });
                request();
              }}
              disabled={!canUse || state.status === 'loading'}
              className='flex w-full items-center justify-between rounded-3xl bg-white/10 px-4 py-3 text-left ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-60'
            >
              <div className='flex items-center gap-3'>
                <LocateFixed size={18} className='text-white/70' />
                <div>
                  <div className='text-sm font-medium'>Use my location</div>
                  <div className='text-xs text-white/60'>
                    {state.status === 'loading'
                      ? 'Locating…'
                      : 'GPS-based alerts and forecast'}
                  </div>
                </div>
              </div>
              <span className='text-xs text-white/60'>
                {active.kind === 'geo' ? 'Selected' : ''}
              </span>
            </button>

            <button
              type='button'
              onClick={() => {
                setActive({ kind: 'fallback' });
                onClose();
              }}
              className='flex w-full items-center justify-between rounded-3xl bg-white/5 px-4 py-3 text-left ring-1 ring-white/10 hover:bg-white/10'
            >
              <div className='flex items-center gap-3'>
                <MapPin size={18} className='text-white/70' />
                <div>
                  <div className='text-sm font-medium'>Use fallback</div>
                  <div className='text-xs text-white/60'>
                    Kansas City, MO, US
                  </div>
                </div>
              </div>
              <span className='text-xs text-white/60'>
                {active.kind === 'fallback' ? 'Selected' : ''}
              </span>
            </button>
          </div>

          <div className='rounded-3xl bg-white/5 p-4 ring-1 ring-white/10'>
            <div className='flex items-center gap-2'>
              <Bookmark size={16} className='text-white/70' />
              <div className='text-sm font-semibold'>Saved cities</div>
            </div>

            {cities.length === 0 ? (
              <div className='mt-3 text-sm text-white/70'>
                No saved cities yet. Add one from the Dashboard search.
              </div>
            ) : (
              <div className='mt-3 grid gap-2'>
                {cities.map((c) => {
                  const label = cityLabel(c.name, c.region, c.country);
                  const selected =
                    active.kind === 'city' && active.cityId === c.id;

                  const p = previewMap.get(label);

                  const temp =
                    typeof p?.temp === 'number'
                      ? `${Math.round(p.temp)}°`
                      : '—';
                  const cond = p?.condition ?? '—';
                  const age = previewAge(p?.updatedAt);

                  const alertsCount = p?.alertsCount ?? 0;
                  const highs = p?.dailyHighs;
                  const lows = p?.dailyLows;

                  return (
                    <button
                      key={c.id}
                      type='button'
                      onClick={() => {
                        setActive({ kind: 'city', cityId: c.id });
                        onClose();
                      }}
                      className={`flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-left ring-1 transition ${
                        selected
                          ? 'bg-white/15 ring-white/20'
                          : 'bg-black/20 ring-white/10 hover:bg-black/25'
                      }`}
                    >
                      {/* Left */}
                      <div className='min-w-0 flex-1'>
                        <div className='flex min-w-0 items-center gap-2'>
                          <div className='min-w-0 truncate text-sm font-medium'>
                            {label}
                          </div>

                          {alertsCount > 0 ? (
                            <span className='shrink-0 inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-100 ring-1 ring-red-400/25'>
                              <AlertTriangle size={12} />
                              {alertsCount}
                            </span>
                          ) : null}
                        </div>

                        <div className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/60'>
                          <span className='text-white/75'>{temp}</span>
                          <span className='opacity-70'>{cond}</span>
                          {age ? (
                            <span className='opacity-50'>• {age}</span>
                          ) : null}
                        </div>
                      </div>

                      {/* Right (fixed) */}
                      <div className='shrink-0 flex items-center gap-2'>
                        <Sparkline highs={highs} lows={lows} />
                        <span className='text-[11px] text-white/60'>
                          {selected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className='text-[11px] text-white/50'>
            Sparklines show once a city has forecast data cached — opening this
            drawer now prefetches the first 3 saved cities automatically.
          </div>
        </div>
      </div>
    </div>
  );
}
