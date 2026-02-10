import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { addCity, removeCity } from '../../store/savedCities';
import { useSavedCities } from '../../hooks/useSavedCities';
import type { SavedCity } from '../../api/schemas';

type Toast =
  | { type: 'success'; message: string }
  | { type: 'info'; message: string };

// type SavedPageNavState = {
//   toast?: Toast;
// };

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isToast(x: unknown): x is Toast {
  if (!isObject(x)) return false;
  const type = x.type;
  const message = x.message;
  return (type === 'success' || type === 'info') && typeof message === 'string';
}

function readToastFromState(state: unknown): Toast | null {
  if (!isObject(state)) return null;
  const toast = (state as Record<string, unknown>).toast;
  return isToast(toast) ? toast : null;
}

export default function SavedCitiesPage() {
  const { cities } = useSavedCities();

  const location = useLocation();
  const navigate = useNavigate();

  const [toast, setToast] = useState<Toast | null>(() =>
    readToastFromState(location.state),
  );

  // Clear nav-state toast so it doesn't replay on refresh/back
  useEffect(() => {
    if (!toast) return;
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1500);
    return () => window.clearTimeout(t);
  }, [toast]);

  function handleAddDemo() {
    const demo: SavedCity = {
      id: 'kansas-city',
      name: 'Kansas City',
      region: 'MO',
      country: 'US',
      lat: 39.0997,
      lon: -94.5786,
      // addedAt set in store
    };

    addCity(demo);
    setToast({ type: 'success', message: 'Saved ✓' });
  }

  function handleRemove(id: string, name: string) {
    removeCity(id);
    setToast({ type: 'info', message: `Removed ${name}` });
  }

  return (
    <div className='space-y-4'>
      <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <div className='text-xs text-white/70'>Saved</div>
            <div className='flex items-baseline gap-3'>
              <h1 className='text-xl font-semibold'>Saved Cities</h1>
              <div className='text-xs text-white/70'>{cities.length} total</div>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            {toast ? (
              <div
                className={`rounded-full px-3 py-1 text-xs ring-1 ${
                  toast.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-200 ring-emerald-400/20'
                    : 'bg-white/10 text-white/80 ring-white/10'
                }`}
                role='status'
                aria-live='polite'
              >
                {toast.message}
              </div>
            ) : null}

            <button
              onClick={handleAddDemo}
              className='rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15'
            >
              Add demo city
            </button>

            <Link
              to='/'
              className='rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15'
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {cities.length === 0 ? (
        <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 text-sm text-white/70'>
          No saved cities yet. Add one from search — or hit “Add demo city”.
        </div>
      ) : (
        <div className='grid gap-3 md:grid-cols-2'>
          {cities.map((c) => {
            const label = `${c.name}${c.region ? `, ${c.region}` : ''}${
              c.country ? `, ${c.country}` : ''
            }`;

            return (
              <div
                key={c.id}
                className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <div className='text-lg font-semibold'>
                      <Link className='hover:underline' to={`/city/${c.id}`}>
                        {c.name}
                      </Link>
                    </div>
                    <div className='text-sm text-white/70'>
                      {c.region ? `${c.region}, ` : ''}
                      {c.country}
                    </div>
                    <div className='mt-2 text-xs text-white/60'>
                      {c.lat.toFixed(3)}, {c.lon.toFixed(3)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(c.id, label)}
                    className='rounded-xl bg-white/10 px-3 py-1 text-xs hover:bg-white/15'
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
