import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchCities } from '../api/geocode';
import { addCity } from '../store/savedCities';
import type { SavedCity } from '../api/schemas';

function stableCityId(r: {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}) {
  // stable slug-ish id (good enough until you want UUIDs)
  const base = `${r.name}-${r.admin1 ?? ''}-${r.country ?? ''}-${r.latitude.toFixed(
    3,
  )}-${r.longitude.toFixed(3)}`;

  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function CitySearch() {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(term.trim()), 250);
    return () => window.clearTimeout(t);
  }, [term]);

  const enabled = debounced.length >= 2;

  const q = useQuery({
    queryKey: ['geocode', debounced],
    queryFn: () => searchCities(debounced),
    enabled,
  });

  const results = useMemo(() => q.data ?? [], [q.data]);

  function handleSave(r: (typeof results)[number]) {
    const city: SavedCity = {
      id: stableCityId({
        name: r.name,
        admin1: r.admin1,
        country: r.country,
        latitude: r.latitude,
        longitude: r.longitude,
      }),
      name: r.name,
      region: r.admin1,
      country: r.country ?? '',
      lat: r.latitude,
      lon: r.longitude,
    };

    addCity(city);
    setTerm('');
    setDebounced('');
  }

  return (
    <div className='rounded-3xl bg-white/5 p-4 ring-1 ring-white/10'>
      <div className='text-sm font-semibold'>Add a city</div>

      <div className='mt-2 flex gap-2'>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder='Search city… (e.g. Chicago)'
          className='w-full rounded-2xl bg-black/20 px-4 py-2 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20'
        />
      </div>

      {enabled && q.isFetching ? (
        <div className='mt-3 text-sm text-white/70'>Searching…</div>
      ) : null}

      {enabled && q.isError ? (
        <div className='mt-3 rounded-2xl bg-black/20 p-3 text-sm text-white/80'>
          Could not search cities right now.
        </div>
      ) : null}

      {enabled && results.length > 0 ? (
        <div className='mt-3 grid gap-2'>
          {results.map((r) => (
            <button
              key={`${r.id}`}
              onClick={() => handleSave(r)}
              className='flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3 text-left ring-1 ring-white/10 hover:bg-black/25'
            >
              <div>
                <div className='text-sm font-medium'>{r.name}</div>
                <div className='text-xs text-white/70'>
                  {r.admin1 ? `${r.admin1}, ` : ''}
                  {r.country ?? ''}
                </div>
              </div>
              <span className='text-xs text-white/70'>Save</span>
            </button>
          ))}
        </div>
      ) : enabled && !q.isFetching ? (
        <div className='mt-3 text-sm text-white/70'>No matches.</div>
      ) : null}
    </div>
  );
}
