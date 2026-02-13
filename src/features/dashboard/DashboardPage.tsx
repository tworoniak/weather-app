import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import WeatherScene from '../../components/WeatherScene';
import ForecastCharts from '../../components/ForecastCharts';
import AlertsBanner from '../../components/AlertsBanner';
import CitySearch from '../../components/CitySearch';

import { useGeolocation } from '../../hooks/useGeolocation';
import { useActiveLocation } from '../../hooks/useActiveLocation';
import { useSavedCities } from '../../hooks/useSavedCities';

import { fetchWeatherByCoords } from '../../api/weather';
import { reverseGeocode, formatPlaceName } from '../../api/geocode';
import type { Coords } from '../../api/schemas';

const FALLBACK_COORDS: Coords = { lat: 39.0997, lon: -94.5786 };
const FALLBACK_LABEL = 'Kansas City, MO, US';

function cityLabel(name: string, region?: string, country?: string) {
  return `${name}${region ? `, ${region}` : ''}${country ? `, ${country}` : ''}`;
}

export default function DashboardPage() {
  const { active, setActive } = useActiveLocation();
  const { cities } = useSavedCities();

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

  const effectiveCoords: Coords = useMemo(() => {
    if (selectedCity) return { lat: selectedCity.lat, lon: selectedCity.lon };
    if (active.kind === 'geo' && geoCoords) return geoCoords;
    return FALLBACK_COORDS;
  }, [selectedCity, active.kind, geoCoords]);

  const basePlaceName = useMemo(() => {
    if (selectedCity) {
      return cityLabel(
        selectedCity.name,
        selectedCity.region,
        selectedCity.country,
      );
    }
    if (active.kind === 'fallback') return FALLBACK_LABEL;
    // geo: we’ll try reverse geocode when ready; otherwise show a helpful placeholder
    return undefined;
  }, [selectedCity, active.kind]);

  // Reverse geocode only when:
  // - active location is geo
  // - and we have a real fix
  const placeQ = useQuery({
    queryKey: [
      'reverse',
      effectiveCoords.lat,
      effectiveCoords.lon,
      active.kind,
    ],
    queryFn: async () => {
      const r = await reverseGeocode(effectiveCoords.lat, effectiveCoords.lon);
      return r ? formatPlaceName(r) : null;
    },
    enabled: active.kind === 'geo' && !!geoCoords,
    staleTime: 60 * 60 * 1000,
  });

  const placeName = useMemo(() => {
    if (basePlaceName) return basePlaceName;
    if (active.kind === 'geo') return placeQ.data ?? undefined;
    return FALLBACK_LABEL;
  }, [basePlaceName, active.kind, placeQ.data]);

  const weatherQ = useQuery({
    queryKey: [
      'weather',
      'coords',
      effectiveCoords.lat,
      effectiveCoords.lon,
      placeName ?? 'no-place',
    ],
    queryFn: () => fetchWeatherByCoords(effectiveCoords, placeName),
  });

  const condition = weatherQ.data?.current.condition ?? 'Loading';
  const isDay = weatherQ.data?.current.isDay ?? true;

  const locationLabel = useMemo(() => {
    if (selectedCity) return 'Saved city';
    if (active.kind === 'geo')
      return geoCoords
        ? 'Current location'
        : 'Current location (waiting for GPS…)';
    return 'Fallback: Kansas City';
  }, [selectedCity, active.kind, geoCoords]);

  return (
    <div className='relative'>
      <div className='space-y-4'>
        <div className='relative rounded-3xl bg-white/5 p-5 ring-1 ring-white/10'>
          <div className='absolute inset-0 -z-10'>
            <WeatherScene condition={condition} isDay={isDay} />
          </div>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <div className='text-xs text-white/70'>Dashboard</div>
              <h1 className='text-xl font-semibold'>Local Forecast</h1>
            </div>

            <div className='flex items-center gap-2'>
              <button
                onClick={() => {
                  setActive({ kind: 'geo' });
                  request();
                }}
                className='rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15'
                disabled={!canUse || state.status === 'loading'}
              >
                {state.status === 'loading' ? 'Locating…' : 'Use my location'}
              </button>
            </div>
          </div>

          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <span className='rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10'>
              {locationLabel}
            </span>

            {active.kind === 'geo' && geoCoords && placeQ.isFetching ? (
              <span className='text-xs text-white/60'>Resolving city…</span>
            ) : null}

            {active.kind === 'geo' && state.status === 'error' ? (
              <span className='text-xs text-white/60'>GPS error</span>
            ) : null}
          </div>

          {active.kind === 'geo' && state.status === 'error' ? (
            <div className='mt-4 rounded-2xl bg-black/20 p-3 text-sm text-white/80'>
              {state.message}
            </div>
          ) : null}

          {weatherQ.isFetching ? (
            <div className='mt-4 text-sm text-white/70'>Fetching forecast…</div>
          ) : null}

          {weatherQ.isError ? (
            <div className='mt-4 rounded-2xl bg-black/20 p-3 text-sm text-white/80'>
              Something went wrong loading weather data.
            </div>
          ) : null}

          {weatherQ.data ? (
            <div className='mt-4 grid gap-4 md:grid-cols-3'>
              <div className='rounded-3xl bg-black/20 p-4 md:col-span-1'>
                <div className='text-sm text-white/70'>
                  {weatherQ.data.placeName}
                </div>
                <div className='mt-2 text-4xl font-semibold'>
                  {Math.round(weatherQ.data.current.temp)}°
                </div>
                <div className='mt-1 text-sm text-white/80'>
                  {weatherQ.data.current.condition}
                </div>
                <div className='mt-3 text-xs text-white/60'>
                  Updated{' '}
                  {new Date(weatherQ.data.updatedAt).toLocaleTimeString()}
                </div>
              </div>

              <div className='space-y-4 md:col-span-2'>
                <AlertsBanner data={weatherQ.data} />
                <ForecastCharts data={weatherQ.data} />
              </div>
            </div>
          ) : null}
        </div>

        <CitySearch />

        <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10'>
          <div className='text-sm font-medium'>Next</div>
          <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-white/75'>
            <li>Location picker drawer (recent searches)</li>
            <li>Animated background presets</li>
            <li>Severe alerts (NWS) detail polish</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
