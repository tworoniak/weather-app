import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ForecastCharts from '../../components/ForecastCharts';
import AlertsBanner from '../../components/AlertsBanner';
import { fetchWeatherByCity } from '../../api/weather';
import { getSavedCityById, removeCity } from '../../store/savedCities';

export default function CityPage() {
  const navigate = useNavigate();
  const params = useParams<Record<string, string | undefined>>();

  // Supports either route param name: :id OR :cityId
  const id = params.id ?? params.cityId;

  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const city = useMemo(() => (id ? getSavedCityById(id) : undefined), [id]);

  const label = city
    ? `${city.name}${city.region ? `, ${city.region}` : ''}${
        city.country ? `, ${city.country}` : ''
      }`
    : 'City';

  const q = useQuery({
    queryKey: ['weather', 'city', id],
    queryFn: () => fetchWeatherByCity(id!),
    enabled: !!id && !!city,
  });

  function handleConfirmRemove() {
    if (!id) return;
    const removedLabel = label;
    removeCity(id);
    navigate('/saved', {
      state: { toast: { type: 'info', message: `Removed ${removedLabel}` } },
    });
  }

  if (!id || !city) {
    return (
      <div className='space-y-4'>
        <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10'>
          <div className='text-xs text-white/70'>City</div>
          <h1 className='text-xl font-semibold'>Not found</h1>

          <div className='mt-3 text-sm text-white/70'>
            This city isn’t in your saved list (or the URL doesn’t match your
            route param).
          </div>

          <div className='mt-4 flex flex-wrap gap-2'>
            <Link
              to='/saved'
              className='rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15'
            >
              View Saved Cities
            </Link>
            <Link
              to='/'
              className='rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15'
            >
              Go to Dashboard
            </Link>
          </div>

          <div className='mt-4 text-xs text-white/50'>
            Debug: param id = {String(id)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='relative'>
      <div className='space-y-4'>
        <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <div className='text-xs text-white/70'>City</div>
              <h1 className='text-xl font-semibold'>{label}</h1>
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

              {!confirmingRemove ? (
                <button
                  type='button'
                  onClick={() => setConfirmingRemove(true)}
                  className='rounded-2xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 ring-1 ring-red-400/20 hover:bg-red-500/15'
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>

          {confirmingRemove ? (
            <div className='mt-4 rounded-2xl bg-black/20 p-4 ring-1 ring-white/10'>
              <div className='text-sm font-medium'>Remove this city?</div>
              <div className='mt-1 text-sm text-white/70'>
                This will remove <span className='text-white/90'>{label}</span>{' '}
                from your saved list.
              </div>

              <div className='mt-3 flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={handleConfirmRemove}
                  className='rounded-2xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-100 ring-1 ring-red-400/25 hover:bg-red-500/25'
                >
                  Yes, remove
                </button>
                <button
                  type='button'
                  onClick={() => setConfirmingRemove(false)}
                  className='rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15'
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {q.isFetching ? (
            <div className='mt-4 text-sm text-white/70'>Fetching forecast…</div>
          ) : null}

          {q.isError ? (
            <div className='mt-4 rounded-2xl bg-black/20 p-3 text-sm text-white/80'>
              Something went wrong loading weather data for this city.
            </div>
          ) : null}

          {q.data ? (
            <div className='mt-4 grid gap-4 md:grid-cols-3'>
              <div className='rounded-3xl bg-black/20 p-4 md:col-span-1'>
                <div className='text-sm text-white/70'>{q.data.placeName}</div>
                <div className='mt-2 text-4xl font-semibold'>
                  {Math.round(q.data.current.temp)}°
                </div>
                <div className='mt-1 text-sm text-white/80'>
                  {q.data.current.condition}
                </div>
                <div className='mt-3 text-xs text-white/60'>
                  Updated {new Date(q.data.updatedAt).toLocaleTimeString()}
                </div>
              </div>

              <div className='space-y-4 md:col-span-2'>
                <AlertsBanner data={q.data} />
                <ForecastCharts data={q.data} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
