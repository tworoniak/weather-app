import { Routes, Route, NavLink } from 'react-router-dom';
import { useMemo, useState } from 'react';

import DashboardPage from './features/dashboard/DashboardPage';
import SavedCitiesPage from './features/saved/SavedCitiesPage';
import CityPage from './features/city/CityPage';
import AlertsPage from './features/alerts/AlertsPage';

import AlertsIndicator from './components/AlertsIndicator';
import LocationPickerDrawer from './components/LocationPickerDrawer';
import AppBackground from './components/AppBackground';

import { Sun, MapPin, Menu, X } from 'lucide-react';
import { useActiveLocation } from './hooks/useActiveLocation';
import { useSavedCities } from './hooks/useSavedCities';

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const base =
    'rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/10';
  const active = 'bg-white/15';

  return (
    <nav className='flex gap-2'>
      <NavLink
        to='/'
        onClick={onNavigate}
        className={({ isActive }) => `${base} ${isActive ? active : ''}`}
      >
        Home
      </NavLink>
      <NavLink
        to='/saved'
        onClick={onNavigate}
        className={({ isActive }) => `${base} ${isActive ? active : ''}`}
      >
        Saved
      </NavLink>
      <NavLink
        to='/alerts'
        onClick={onNavigate}
        className={({ isActive }) => `${base} ${isActive ? active : ''}`}
      >
        Alerts
      </NavLink>
    </nav>
  );
}

export default function App() {
  const [locationOpen, setLocationOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { active } = useActiveLocation();
  const { cities } = useSavedCities();

  const locationLabel = useMemo(() => {
    if (active.kind === 'geo') return 'Current location';
    if (active.kind === 'fallback') return 'Kansas City';
    if (active.kind === 'recent') return active.label;

    if (active.kind === 'city') {
      const c = cities.find((x) => x.id === active.cityId);
      if (!c) return 'Saved city';
      return c.region ? `${c.name}, ${c.region}` : c.name;
    }

    return 'Location';
  }, [active, cities]);

  return (
    <div className='min-h-screen text-white'>
      {/* Full-viewport animated background */}
      <AppBackground />
      {/* subtle contrast overlay so UI stays readable */}
      <div className='fixed inset-0 -z-10 bg-black/20' />

      <header className='mx-auto w-full max-w-5xl px-4 pt-4'>
        {/* Row 1 */}
        <div className='flex items-center justify-between gap-3'>
          {/* Brand */}
          <div className='flex min-w-0 items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-accent2'>
              <Sun />
            </div>
            <div className='min-w-0 leading-tight'>
              <div className='truncate text-sm opacity-80'>ReactWeather</div>
              <div className='truncate text-lg font-semibold'>A Cool App</div>
            </div>
          </div>

          {/* Desktop: location + alerts + nav */}
          <div className='hidden items-center gap-3 md:flex'>
            <button
              type='button'
              onClick={() => setLocationOpen(true)}
              className='inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15'
              title='Choose location'
            >
              <MapPin size={16} className='text-white/70' />
              <span className='max-w-55 truncate'>{locationLabel}</span>
            </button>

            <AlertsIndicator />

            <NavLinks />
          </div>

          {/* Mobile: alerts + menu */}
          <div className='flex items-center gap-2 md:hidden'>
            <AlertsIndicator />
            <button
              type='button'
              onClick={() => setMobileNavOpen((v) => !v)}
              className='rounded-2xl bg-white/10 p-2 ring-1 ring-white/10 hover:bg-white/15'
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Row 2 (mobile only): Location pill full width */}
        <div className='mt-3 md:hidden'>
          <button
            type='button'
            onClick={() => {
              setMobileNavOpen(false);
              setLocationOpen(true);
            }}
            className='flex w-full items-center justify-between gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15'
            title='Choose location'
          >
            <span className='inline-flex min-w-0 items-center gap-2'>
              <MapPin size={16} className='shrink-0 text-white/70' />
              <span className='truncate'>{locationLabel}</span>
            </span>
            <span className='text-xs text-white/60'>Change</span>
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen ? (
          <div className='mt-3 md:hidden'>
            <div className='rounded-3xl bg-white/5 p-3 ring-1 ring-white/10 backdrop-blur-md'>
              <NavLinks onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className='mt-4 h-px bg-white/10' />
      </header>

      <main className='mx-auto w-full max-w-5xl px-4 pb-10 pt-4'>
        <Routes>
          <Route path='/' element={<DashboardPage />} />
          <Route path='/saved' element={<SavedCitiesPage />} />
          <Route path='/city/:id' element={<CityPage />} />
          <Route path='/alerts' element={<AlertsPage />} />
        </Routes>
      </main>

      <LocationPickerDrawer
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
      />
    </div>
  );
}
