import { useQuery } from '@tanstack/react-query';
import WeatherScene from '../../components/WeatherScene';
import ForecastCharts from '../../components/ForecastCharts';
import AlertsBanner from '../../components/AlertsBanner';
import { useGeolocation } from '../../hooks/useGeolocation';
import { fetchWeatherByCoords } from '../../api/weather';

export default function DashboardPage() {
  const { state, request, canUse } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 30_000,
    maximumAge: 10 * 60_000, // 10 minutes cached ok
  });

  const fallbackCoords = { lat: 39.0997, lon: -94.5786 }; // Kansas City
  const effectiveCoords =
    state.status === 'ready' ? state.coords : fallbackCoords;

  const usingFallback = state.status !== 'ready';
  const locationLabel =
    state.status === 'ready' ? 'Current location' : 'Fallback: Kansas City';

  const weatherQ = useQuery({
    queryKey: ['weather', 'coords', effectiveCoords.lat, effectiveCoords.lon],
    queryFn: () => fetchWeatherByCoords(effectiveCoords),
  });

  const condition = weatherQ.data?.current.condition ?? 'Loading';

  return (
    <div className='space-y-4'>
      <WeatherScene condition={condition} />

      <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10'>
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

        {/* Location source pill + quick action */}
        <div className='mt-3 flex flex-wrap items-center gap-2'>
          <span className='rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10'>
            {locationLabel}
          </span>

          {usingFallback ? (
            <button
              onClick={request}
              className='rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/15 ring-1 ring-white/10'
              disabled={!canUse || state.status === 'loading'}
            >
              Try location again
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className='rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/15 ring-1 ring-white/10'
              title='Reload to re-check location + refresh data'
            >
              Refresh
            </button>
          )}
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
                Updated {new Date(weatherQ.data.updatedAt).toLocaleTimeString()}
              </div>
            </div>

            <div className='md:col-span-2 space-y-4'>
              <AlertsBanner data={weatherQ.data} />
              <ForecastCharts data={weatherQ.data} />
            </div>
          </div>
        ) : null}
      </div>

      <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10'>
        <div className='text-sm font-medium'>Next</div>
        <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-white/75'>
          <li>City search + save</li>
          <li>Real provider wiring + normalization</li>
          <li>Animated background presets</li>
          <li>Alert details panel</li>
        </ul>
      </div>
    </div>
  );
}
