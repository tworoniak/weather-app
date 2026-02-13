import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

// import WeatherScene from '../../components/WeatherScene';
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
  const { active } = useActiveLocation();
  const { cities } = useSavedCities();

  const { state, request, canUse } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 30_000,
    maximumAge: 10 * 60_000,
  });

  // If active is geo and we don't have coords yet, request once.
  const requestedGeoRef = useRef(false);
  useEffect(() => {
    if (active.kind !== 'geo') {
      requestedGeoRef.current = false;
      return;
    }
    if (!canUse) return;
    if (state.status === 'ready' || state.status === 'loading') return;
    if (requestedGeoRef.current) return;

    requestedGeoRef.current = true;
    request();
  }, [active.kind, canUse, request, state.status]);

  const activeCity = useMemo(() => {
    if (active.kind !== 'city') return null;
    return cities.find((c) => c.id === active.cityId) ?? null;
  }, [active, cities]);

  const coords: Coords = useMemo(() => {
    if (active.kind === 'recent') return active.coords;
    if (active.kind === 'city' && activeCity)
      return { lat: activeCity.lat, lon: activeCity.lon };
    if (active.kind === 'geo' && state.status === 'ready') return state.coords;
    return FALLBACK_COORDS;
  }, [active, activeCity, state]);

  // Base label (may be improved by reverse geocode when geo is ready)
  const baseLabel = useMemo(() => {
    if (active.kind === 'recent') return active.label;
    if (active.kind === 'city' && activeCity)
      return cityLabel(activeCity.name, activeCity.region, activeCity.country);
    if (active.kind === 'geo') return 'Current location';
    return FALLBACK_LABEL;
  }, [active, activeCity]);

  // Reverse geocode only for GEO when we have a real fix
  const placeQ = useQuery({
    queryKey: ['reverse', coords.lat, coords.lon, active.kind, state.status],
    queryFn: async () => {
      const r = await reverseGeocode(coords.lat, coords.lon);
      return r ? formatPlaceName(r) : null;
    },
    enabled: active.kind === 'geo' && state.status === 'ready',
    staleTime: 60 * 60 * 1000,
  });

  const placeName =
    active.kind === 'geo' && state.status === 'ready'
      ? (placeQ.data ?? baseLabel)
      : baseLabel;

  const weatherQ = useQuery({
    queryKey: ['weather', 'coords', coords.lat, coords.lon, placeName],
    queryFn: () => fetchWeatherByCoords(coords, placeName),
  });

  // const condition = weatherQ.data?.current.condition ?? 'Loading';
  // const isDay = weatherQ.data?.current.isDay ?? true;

  const locationChip = useMemo(() => {
    if (active.kind === 'geo') return 'Current location';
    if (active.kind === 'recent') return 'Recent search';
    if (active.kind === 'city') return 'Saved city';
    return 'Fallback';
  }, [active.kind]);

  return (
    <div className='relative'>
      <div className='space-y-4'>
        <div className='relative rounded-3xl bg-white/5 p-5 ring-1 ring-white/10'>
          {/* <div className='absolute inset-0 -z-10'>
            <WeatherScene condition={condition} isDay={isDay} />
          </div> */}
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <div className='text-xs text-white/70'>Dashboard</div>
              <h1 className='text-xl font-semibold'>Local Forecast</h1>
            </div>

            <div className='flex items-center gap-2'>
              <button
                onClick={request}
                className='rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15'
                disabled={!canUse || state.status === 'loading'}
                title='Request GPS location'
              >
                {state.status === 'loading' ? 'Locating…' : 'Use my location'}
              </button>
            </div>
          </div>

          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <span className='rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10'>
              {locationChip}
            </span>

            <span className='text-xs text-white/60'>{placeName}</span>

            {active.kind === 'geo' &&
            state.status === 'ready' &&
            placeQ.isFetching ? (
              <span className='text-xs text-white/60'>Resolving city…</span>
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
      </div>
    </div>
  );
}
