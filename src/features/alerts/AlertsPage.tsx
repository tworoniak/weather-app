import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ExternalLink,
  Search,
  SlidersHorizontal,
  RefreshCcw,
  MapPin,
} from 'lucide-react';

import type { Coords, WeatherAlert } from '../../api/schemas';
import { fetchNwsAlertsByCoords } from '../../api/nws';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useSavedCities } from '../../hooks/useSavedCities';
import { useActiveLocation } from '../../hooks/useActiveLocation';
import { reverseGeocode, formatPlaceName } from '../../api/geocode';

const FALLBACK_COORDS: Coords = { lat: 39.0997, lon: -94.5786 };
const FALLBACK_LABEL = 'Kansas City, MO, US';

function stripLongWhitespace(s: string) {
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

function isExpired(expires?: number) {
  if (!expires) return false;
  return expires <= Date.now();
}

function severityRank(sev: WeatherAlert['severity']) {
  switch (sev) {
    case 'Extreme':
      return 0;
    case 'Severe':
      return 1;
    case 'Moderate':
      return 2;
    case 'Minor':
      return 3;
    default:
      return 4;
  }
}

function formatTime(ts?: number) {
  if (!ts) return null;
  const d = new Date(ts);
  return d.toLocaleString([], {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function timeUntil(ts?: number) {
  if (!ts) return null;
  const ms = ts - Date.now();
  if (!Number.isFinite(ms)) return null;
  if (ms <= 0) return 'Expired';

  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h <= 0 ? `${m}m` : `${h}h ${m}m`;
}

function severityPill(sev: WeatherAlert['severity']) {
  switch (sev) {
    case 'Extreme':
      return 'bg-red-500/15 ring-red-400/25 text-red-100';
    case 'Severe':
      return 'bg-orange-500/15 ring-orange-400/25 text-orange-100';
    case 'Moderate':
      return 'bg-amber-500/15 ring-amber-400/25 text-amber-100';
    case 'Minor':
      return 'bg-sky-500/15 ring-sky-400/25 text-sky-100';
    default:
      return 'bg-white/10 ring-white/10 text-white/80';
  }
}

type SeverityFilter = WeatherAlert['severity'] | 'All';

function cityLabel(name: string, region?: string, country?: string) {
  return `${name}${region ? `, ${region}` : ''}${country ? `, ${country}` : ''}`;
}

export default function AlertsPage() {
  const { active, setActive } = useActiveLocation();
  const { cities } = useSavedCities();

  const [q, setQ] = useState('');
  const [severity, setSeverity] = useState<SeverityFilter>('All');
  const [hideExpired, setHideExpired] = useState(true);

  const { state, request, canUse } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 30_000,
    maximumAge: 10 * 60_000,
  });

  const geoCoords: Coords | null =
    state.status === 'ready' ? state.coords : null;

  const selectedCity = useMemo(() => {
    if (active.kind !== 'city') return null;
    return cities.find((c) => c.id === active.cityId) ?? null;
  }, [active, cities]);

  // ✅ Coords selection now includes "recent"
  const effectiveCoords: Coords = useMemo(() => {
    if (active.kind === 'recent') return active.coords;
    if (selectedCity) return { lat: selectedCity.lat, lon: selectedCity.lon };
    if (active.kind === 'geo' && geoCoords) return geoCoords;
    return FALLBACK_COORDS;
  }, [active, selectedCity, geoCoords]);

  // Base label before reverse-geocode
  const baseLabel = useMemo(() => {
    if (active.kind === 'recent') return active.label;
    if (selectedCity)
      return cityLabel(
        selectedCity.name,
        selectedCity.region,
        selectedCity.country,
      );
    if (active.kind === 'geo')
      return geoCoords
        ? 'Current location'
        : 'Current location (waiting for GPS…)';
    return FALLBACK_LABEL;
  }, [active, selectedCity, geoCoords]);

  // ✅ Reverse geocode only for GEO + real fix
  const placeQ = useQuery({
    queryKey: [
      'reverse',
      effectiveCoords.lat,
      effectiveCoords.lon,
      active.kind,
      state.status,
    ],
    queryFn: async () => {
      const r = await reverseGeocode(effectiveCoords.lat, effectiveCoords.lon);
      return r ? formatPlaceName(r) : null;
    },
    enabled: active.kind === 'geo' && state.status === 'ready',
    staleTime: 60 * 60 * 1000,
  });

  const sourceLabel =
    active.kind === 'geo' && state.status === 'ready'
      ? (placeQ.data ?? baseLabel)
      : baseLabel;

  const alertsQ = useQuery({
    queryKey: ['nws-alerts', effectiveCoords.lat, effectiveCoords.lon],
    queryFn: () => fetchNwsAlertsByCoords(effectiveCoords),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rawAlerts = useMemo(() => alertsQ.data ?? [], [alertsQ.data]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return rawAlerts
      .filter((a) => (hideExpired ? !isExpired(a.expires) : true))
      .filter((a) => (severity === 'All' ? true : a.severity === severity))
      .filter((a) => {
        if (!term) return true;
        const hay = [
          a.title,
          a.headline,
          a.areaDesc,
          a.description,
          a.instruction,
          a.sender,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(term);
      })
      .sort((a, b) => {
        const r = severityRank(a.severity) - severityRank(b.severity);
        if (r !== 0) return r;
        const ae = a.expires ?? Number.POSITIVE_INFINITY;
        const be = b.expires ?? Number.POSITIVE_INFINITY;
        return ae - be;
      });
  }, [rawAlerts, q, severity, hideExpired]);

  const counts = useMemo(() => {
    const map: Record<SeverityFilter, number> = {
      All: 0,
      Extreme: 0,
      Severe: 0,
      Moderate: 0,
      Minor: 0,
      Unknown: 0,
    };

    for (const a of rawAlerts) {
      if (hideExpired && isExpired(a.expires)) continue;
      map.All += 1;
      map[a.severity] += 1;
    }
    return map;
  }, [rawAlerts, hideExpired]);

  return (
    <div className='space-y-4'>
      <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <div className='text-xs text-white/70'>Alerts</div>
            <h1 className='text-xl font-semibold'>Severe Weather Alerts</h1>
            <div className='mt-1 text-sm text-white/70'>
              Live data from the National Weather Service (NWS).
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <Link
              to='/'
              className='rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15'
            >
              Dashboard
            </Link>
            <Link
              to='/saved'
              className='rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15'
            >
              Saved
            </Link>
          </div>
        </div>

        {/* Source controls */}
        <div className='mt-4 grid gap-3 md:grid-cols-3'>
          <div className='rounded-2xl bg-black/20 p-3 ring-1 ring-white/10 md:col-span-2'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex items-center gap-2 text-xs text-white/70'>
                <MapPin size={16} className='text-white/50' />
                Source:{' '}
                <span className='font-medium text-white/85'>{sourceLabel}</span>
                {active.kind === 'geo' &&
                state.status === 'ready' &&
                placeQ.isFetching ? (
                  <span className='text-white/50'>• resolving…</span>
                ) : null}
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                <button
                  type='button'
                  onClick={() => {
                    setActive({ kind: 'geo' });
                    request();
                  }}
                  disabled={!canUse || state.status === 'loading'}
                  className='rounded-2xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-60'
                >
                  {state.status === 'loading' ? 'Locating…' : 'Use my location'}
                </button>

                <button
                  type='button'
                  onClick={() => setActive({ kind: 'fallback' })}
                  className='rounded-2xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/15'
                >
                  Use fallback
                </button>

                <button
                  type='button'
                  onClick={() => alertsQ.refetch()}
                  className='inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/15'
                >
                  <span className='inline-flex'>
                    <RefreshCcw size={14} />
                  </span>
                  Refresh
                </button>
              </div>
            </div>

            {active.kind === 'geo' && state.status === 'error' ? (
              <div className='mt-2 rounded-2xl bg-black/20 p-3 text-xs text-white/80 ring-1 ring-white/10'>
                {state.message}
              </div>
            ) : null}
          </div>

          <div className='rounded-2xl bg-black/20 p-3 ring-1 ring-white/10'>
            <div className='text-xs text-white/70'>Saved city</div>
            <select
              value={active.kind === 'city' ? active.cityId : ''}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) setActive({ kind: 'fallback' });
                else setActive({ kind: 'city', cityId: id });
              }}
              className='mt-2 w-full rounded-2xl bg-black/20 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20'
            >
              <option value=''>— none —</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.region ? `, ${c.region}` : ''}
                  {c.country ? `, ${c.country}` : ''}
                </option>
              ))}
            </select>

            <div className='mt-2 text-[11px] text-white/50'>
              Selecting a city updates the global location.
            </div>
          </div>
        </div>

        {/* Search + toggle */}
        <div className='mt-3 grid gap-3 md:grid-cols-3'>
          <div className='md:col-span-2'>
            <div className='flex items-center gap-2 rounded-2xl bg-black/20 px-3 py-2 ring-1 ring-white/10'>
              <Search size={16} className='text-white/50' />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Search alerts (title, area, description)…'
                className='w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none'
              />
            </div>
          </div>

          <div className='flex items-center justify-between gap-2 rounded-2xl bg-black/20 px-3 py-2 ring-1 ring-white/10'>
            <div className='flex items-center gap-2 text-xs text-white/70'>
              <SlidersHorizontal size={16} className='text-white/50' />
              Hide expired
            </div>
            <button
              type='button'
              onClick={() => setHideExpired((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
                hideExpired
                  ? 'bg-white/15 text-white ring-white/20'
                  : 'bg-white/5 text-white/70 ring-white/10 hover:bg-white/10'
              }`}
            >
              {hideExpired ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Severity chips */}
        <div className='mt-3 flex flex-wrap gap-2'>
          {(
            [
              'All',
              'Extreme',
              'Severe',
              'Moderate',
              'Minor',
              'Unknown',
            ] as const
          ).map((s) => (
            <button
              key={s}
              type='button'
              onClick={() => setSeverity(s)}
              className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
                severity === s
                  ? 'bg-white/15 text-white ring-white/20'
                  : 'bg-white/5 text-white/70 ring-white/10 hover:bg-white/10'
              }`}
            >
              {s} <span className='text-white/50'>({counts[s]})</span>
            </button>
          ))}
        </div>
      </div>

      {alertsQ.isFetching ? (
        <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 text-sm text-white/70'>
          Fetching live alerts…
        </div>
      ) : null}

      {alertsQ.isError ? (
        <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 text-sm text-white/70'>
          Could not load alerts right now. Try Refresh.
        </div>
      ) : null}

      {!alertsQ.isFetching && !alertsQ.isError && filtered.length === 0 ? (
        <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 text-sm text-white/70'>
          No alerts found for this location.
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <div className='space-y-2'>
          {filtered.map((a) => {
            const expiresStr = formatTime(a.expires);
            const until = timeUntil(a.expires);
            const effectiveStr = formatTime(a.effective);

            return (
              <div
                key={a.id}
                className='rounded-3xl bg-white/5 p-4 ring-1 ring-white/10'
              >
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${severityPill(
                          a.severity,
                        )}`}
                      >
                        {a.severity}
                      </span>

                      <div className='text-sm font-semibold text-white/90'>
                        {a.title}
                      </div>
                    </div>

                    {a.headline ? (
                      <div className='mt-1 text-xs text-white/70'>
                        {a.headline}
                      </div>
                    ) : null}

                    <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60'>
                      <span>
                        Urgency:{' '}
                        <span className='text-white/75'>{a.urgency}</span>
                      </span>
                      <span>
                        Certainty:{' '}
                        <span className='text-white/75'>{a.certainty}</span>
                      </span>

                      {effectiveStr ? (
                        <span>
                          Effective:{' '}
                          <span className='text-white/75'>{effectiveStr}</span>
                        </span>
                      ) : null}

                      {expiresStr ? (
                        <span>
                          Expires:{' '}
                          <span className='text-white/75'>{expiresStr}</span>
                          {until ? (
                            <span className='text-white/55'> ({until})</span>
                          ) : null}
                        </span>
                      ) : null}
                    </div>

                    {a.areaDesc ? (
                      <div className='mt-2 text-xs text-white/55'>
                        Area: {a.areaDesc}
                      </div>
                    ) : null}
                  </div>

                  <div className='flex shrink-0 items-center gap-2'>
                    {a.link ? (
                      <a
                        href={a.link}
                        target='_blank'
                        rel='noreferrer'
                        className='inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/15'
                      >
                        <ExternalLink size={14} />
                        NWS Link
                      </a>
                    ) : null}
                  </div>
                </div>

                {a.description ? (
                  <div className='mt-3 whitespace-pre-wrap rounded-2xl bg-black/20 p-3 text-xs text-white/75 ring-1 ring-white/10'>
                    {stripLongWhitespace(a.description)}
                  </div>
                ) : null}

                {a.instruction ? (
                  <div className='mt-2 whitespace-pre-wrap rounded-2xl bg-black/20 p-3 text-xs text-white/75 ring-1 ring-white/10'>
                    <div className='mb-1 text-[11px] font-semibold text-white/85'>
                      Instructions
                    </div>
                    {stripLongWhitespace(a.instruction)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
