import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { searchCities } from '../api/geocode';
import { addCity } from '../store/savedCities';
import { useSavedCities } from '../hooks/useSavedCities';
import type { SavedCity } from '../api/schemas';
import { addRecentSearch } from '../store/recentSearches';

function stableCityId(r: {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}) {
  const base = `${r.name}-${r.admin1 ?? ''}-${r.country ?? ''}-${r.latitude.toFixed(
    3,
  )}-${r.longitude.toFixed(3)}`;

  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

type Toast =
  | { type: 'success'; message: string }
  | { type: 'info'; message: string }
  | null;

export default function CitySearch() {
  const navigate = useNavigate();
  const { cities } = useSavedCities();

  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [toast, setToast] = useState<Toast>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Active index lives in state, but we ONLY set it from user events (not effects)
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(term.trim()), 250);
    return () => window.clearTimeout(t);
  }, [term]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const enabled = debounced.length >= 2;

  const q = useQuery({
    queryKey: ['geocode', debounced],
    queryFn: () => searchCities(debounced),
    enabled,
  });

  const results = useMemo(() => q.data ?? [], [q.data]);
  const savedIds = useMemo(() => new Set(cities.map((c) => c.id)), [cities]);

  // Clamp for rendering only (no state updates here)
  const hasResults = enabled && results.length > 0;
  const safeActiveIndex = hasResults
    ? clamp(activeIndex, 0, results.length - 1)
    : -1;

  function clearSearch() {
    setActiveIndex(-1);
    setTerm('');
    setDebounced('');
  }

  function actOnResult(r: (typeof results)[number]) {
    const id = stableCityId({
      name: r.name,
      admin1: r.admin1,
      country: r.country,
      latitude: r.latitude,
      longitude: r.longitude,
    });

    if (savedIds.has(id)) {
      navigate(`/city/${id}`);
      return;
    }

    setSavingId(id);

    const city: SavedCity = {
      id,
      name: r.name,
      region: r.admin1,
      country: r.country ?? '',
      lat: r.latitude,
      lon: r.longitude,
    };

    addCity(city);
    addRecentSearch(city);

    setSavingId(null);
    setToast({ type: 'success', message: 'Saved ✓' });
    clearSearch();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      clearSearch();
      return;
    }

    if (!hasResults) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = i < 0 ? 0 : i + 1;
        return clamp(next, 0, results.length - 1);
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = i < 0 ? 0 : i - 1;
        return clamp(next, 0, results.length - 1);
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const r = results[safeActiveIndex] ?? results[0];
      if (r) actOnResult(r);
    }
  }

  return (
    <div className='rounded-3xl bg-white/5 p-4 ring-1 ring-white/10'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-baseline gap-3'>
          <div className='text-sm font-semibold'>Add a city</div>

          <Link
            to='/saved'
            className='text-xs text-white/70 hover:text-white hover:underline'
          >
            Saved: <span className='text-white/90'>{cities.length}</span>
          </Link>
        </div>

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
      </div>

      <div className='mt-2 flex gap-2'>
        <input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setActiveIndex(-1); // reset selection on new typing (event handler ✅)
          }}
          onKeyDown={onKeyDown}
          placeholder='Search city… (e.g. Chicago)'
          className='w-full rounded-2xl bg-black/20 px-4 py-2 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20'
          aria-label='Search city'
          role='combobox'
          aria-expanded={hasResults}
          aria-controls='city-search-results'
          aria-activedescendant={
            safeActiveIndex >= 0 ? `city-result-${safeActiveIndex}` : undefined
          }
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

      {hasResults ? (
        <>
          <div
            id='city-search-results'
            role='listbox'
            className='mt-3 grid gap-2'
          >
            {results.map((r, idx) => {
              const id = stableCityId({
                name: r.name,
                admin1: r.admin1,
                country: r.country,
                latitude: r.latitude,
                longitude: r.longitude,
              });

              const alreadySaved = savedIds.has(id);
              const isSaving = savingId === id;
              const isActive = idx === safeActiveIndex;

              return (
                <div
                  key={`${r.id}`}
                  id={`city-result-${idx}`}
                  role='option'
                  aria-selected={isActive}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 ring-1 ${
                    isActive
                      ? 'bg-white/10 ring-white/20'
                      : alreadySaved
                        ? 'bg-black/10 ring-white/5'
                        : 'bg-black/20 ring-white/10'
                  }`}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div>
                    <div className='text-sm font-medium text-white'>
                      {r.name}
                    </div>
                    <div className='text-xs text-white/70'>
                      {r.admin1 ? `${r.admin1}, ` : ''}
                      {r.country ?? ''}
                    </div>
                  </div>

                  {alreadySaved ? (
                    <Link
                      to={`/city/${id}`}
                      className='rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10 hover:bg-white/15'
                    >
                      View
                    </Link>
                  ) : (
                    <button
                      type='button'
                      onClick={() => actOnResult(r)}
                      disabled={isSaving}
                      className='rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-50'
                    >
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className='mt-2 text-xs text-white/50'>
            ↑/↓ to navigate • Enter to save/view • Esc to clear
          </div>
        </>
      ) : enabled && !q.isFetching ? (
        <div className='mt-3 text-sm text-white/70'>No matches.</div>
      ) : null}
    </div>
  );
}
