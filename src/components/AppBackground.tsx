import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import WeatherScene from './WeatherScene';
import { useActiveLocation } from '../hooks/useActiveLocation';
import { useSavedCities } from '../hooks/useSavedCities';
import { useGeolocation } from '../hooks/useGeolocation';

import { fetchWeatherByCoords } from '../api/weather';
import type { Coords } from '../api/schemas';

const FALLBACK_COORDS: Coords = { lat: 39.0997, lon: -94.5786 };
const FALLBACK_LABEL = 'Kansas City, MO, US';

function cityLabel(name: string, region?: string, country?: string) {
  return `${name}${region ? `, ${region}` : ''}${country ? `, ${country}` : ''}`;
}

export default function AppBackground() {
  const { active } = useActiveLocation();
  const { cities } = useSavedCities();

  const { state } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 30_000,
    maximumAge: 10 * 60_000,
  });

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

  const label = useMemo(() => {
    if (active.kind === 'recent') return active.label;
    if (active.kind === 'city' && activeCity)
      return cityLabel(activeCity.name, activeCity.region, activeCity.country);
    if (active.kind === 'geo') return 'Current location';
    return FALLBACK_LABEL;
  }, [active, activeCity]);

  const weatherQ = useQuery({
    queryKey: ['weather', 'bg', coords.lat, coords.lon, label],
    queryFn: () => fetchWeatherByCoords(coords, label),
    staleTime: 2 * 60 * 1000,
  });

  const condition = weatherQ.data?.current.condition ?? 'Clear';
  const isDay = weatherQ.data?.current.isDay ?? true;

  return (
    <div className='fixed inset-0 -z-10'>
      <WeatherScene condition={condition} isDay={isDay} />
      {/* optional contrast veil */}
      <div className='absolute inset-0 bg-black/25' />
    </div>
  );
}
