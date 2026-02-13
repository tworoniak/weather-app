import { useEffect, useMemo } from 'react';
import { X, MapPin, LocateFixed, Bookmark } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useSavedCities } from '../hooks/useSavedCities';
import { useActiveLocation } from '../hooks/useActiveLocation';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LocationPickerDrawer({ open, onClose }: Props) {
  const { cities } = useSavedCities();
  const { active, setActive } = useActiveLocation();

  const { state, request, canUse } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 30_000,
    maximumAge: 10 * 60_000,
  });

  // If user tapped "Use my location", close once we actually get a fix.
  useEffect(() => {
    if (!open) return;
    if (active.kind !== 'geo') return;
    if (state.status === 'ready') onClose();
  }, [open, active.kind, state.status, onClose]);

  const activeCityId = active.kind === 'city' ? active.cityId : null;

  const activeCityLabel = useMemo(() => {
    if (!activeCityId) return null;
    const c = cities.find((x) => x.id === activeCityId);
    if (!c) return null;
    return `${c.name}${c.region ? `, ${c.region}` : ''}${c.country ? `, ${c.country}` : ''}`;
  }, [cities, activeCityId]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50'>
      {/* Backdrop */}
      <button
        type='button'
        className='absolute inset-0 bg-black/60'
        onClick={onClose}
        aria-label='Close location picker'
      />

      {/* Panel */}
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

        <div className='px-5 pb-6 space-y-4'>
          {/* Current selection */}
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

          {/* Actions */}
          <div className='grid gap-2'>
            <button
              type='button'
              onClick={() => {
                setActive({ kind: 'geo' });
                request();
              }}
              disabled={!canUse || state.status === 'loading'}
              className='flex items-center justify-between rounded-3xl bg-white/10 px-4 py-3 text-left ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-60'
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
              className='flex items-center justify-between rounded-3xl bg-white/5 px-4 py-3 text-left ring-1 ring-white/10 hover:bg-white/10'
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

          {/* Saved cities */}
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
                  const label = `${c.name}${c.region ? `, ${c.region}` : ''}${
                    c.country ? `, ${c.country}` : ''
                  }`;
                  const selected =
                    active.kind === 'city' && active.cityId === c.id;

                  return (
                    <button
                      key={c.id}
                      type='button'
                      onClick={() => {
                        setActive({ kind: 'city', cityId: c.id });
                        onClose();
                      }}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left ring-1 transition ${
                        selected
                          ? 'bg-white/15 ring-white/20'
                          : 'bg-black/20 ring-white/10 hover:bg-black/25'
                      }`}
                    >
                      <div className='min-w-0'>
                        <div className='text-sm font-medium truncate'>
                          {label}
                        </div>
                        <div className='mt-1 text-xs text-white/60'>
                          {c.lat.toFixed(2)}, {c.lon.toFixed(2)}
                        </div>
                      </div>
                      <span className='text-xs text-white/60'>
                        {selected ? 'Selected' : 'Select'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className='text-[11px] text-white/50'>
            Next: add “Recent searches” + a “Manage cities” shortcut.
          </div>
        </div>
      </div>
    </div>
  );
}
