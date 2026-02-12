import { useQuery } from '@tanstack/react-query';
import WeatherScene from '../../components/WeatherScene';
import ForecastCharts from '../../components/ForecastCharts';
import AlertsBanner from '../../components/AlertsBanner';
import CitySearch from '../../components/CitySearch';
import { useGeolocation } from '../../hooks/useGeolocation';
import { fetchWeatherByCoords } from '../../api/weather';
import { reverseGeocode, formatPlaceName } from '../../api/geocode';

export default function DashboardPage() {
  const { state, request, canUse } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 30_000,
    maximumAge: 10 * 60_000,
  });

  const fallbackCoords = { lat: 39.0997, lon: -94.5786 };
  const fallbackLabel = 'Kansas City, MO, US';

  const effectiveCoords =
    state.status === 'ready' ? state.coords : fallbackCoords;

  // Reverse geocode only when we have a real GPS fix (not fallback)
  const placeQ = useQuery({
    queryKey: [
      'reverse',
      effectiveCoords.lat,
      effectiveCoords.lon,
      state.status,
    ],
    queryFn: async () => {
      const r = await reverseGeocode(effectiveCoords.lat, effectiveCoords.lon);
      return r ? formatPlaceName(r) : null;
    },
    enabled: state.status === 'ready',
    staleTime: 60 * 60 * 1000,
  });

  const placeName =
    state.status === 'ready' ? (placeQ.data ?? undefined) : fallbackLabel;

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

  const locationLabel =
    state.status === 'ready' ? 'Current location' : 'Fallback: Kansas City';

  const isDay = weatherQ.data?.current.isDay ?? true;

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
                onClick={request}
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

            {state.status === 'ready' && placeQ.isFetching ? (
              <span className='text-xs text-white/60'>Resolving city…</span>
            ) : null}
          </div>

          {state.status === 'error' ? (
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
            <li>
              Integrate real severe weather alerts using the National Weather
              Service (NWS) API.
            </li>
            <li>Add settings toggles for Fahrenheit/Celsius and mph/kph.</li>
            <li>
              Improve city search UX with keyboard navigation and recent
              searches.
            </li>
            <li>
              Add richer hourly visualizations (humidity, UV index,
              sunrise/sunset markers).
            </li>
            <li>
              Enhance weather scenes with Canvas-based particles and smoother
              motion transitions.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
