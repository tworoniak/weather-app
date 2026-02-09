import { useState } from 'react';
import { addCity, getSavedCities, removeCity } from '../../store/savedCities';
import type { SavedCity } from '../../api/schemas';
import { Link } from 'react-router-dom';

export default function SavedCitiesPage() {
  // ✅ initialize from localStorage without an effect
  const [cities, setCities] = useState<SavedCity[]>(() => getSavedCities());

  function refresh() {
    setCities(getSavedCities());
  }

  function handleAddDemo() {
    const demo: SavedCity = {
      id: 'kansas-city',
      name: 'Kansas City',
      region: 'MO',
      country: 'US',
      lat: 39.0997,
      lon: -94.5786,
      addedAt: Date.now(),
    };

    addCity(demo);
    refresh();
  }

  function handleRemove(id: string) {
    removeCity(id);
    refresh();
  }

  return (
    <div className='space-y-4'>
      <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <div className='text-xs text-white/70'>Saved</div>
            <h1 className='text-xl font-semibold'>Saved Cities</h1>
          </div>
          <button
            onClick={handleAddDemo}
            className='rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15'
          >
            Add demo city
          </button>
        </div>
      </div>

      {cities.length === 0 ? (
        <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 text-sm text-white/70'>
          No saved cities yet. Add one from search (next step) — or hit “Add
          demo city”.
        </div>
      ) : (
        <div className='grid gap-3 md:grid-cols-2'>
          {cities.map((c) => (
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
                  onClick={() => handleRemove(c.id)}
                  className='rounded-xl bg-white/10 px-3 py-1 text-xs hover:bg-white/15'
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
