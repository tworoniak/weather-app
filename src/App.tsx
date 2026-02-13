import { Routes, Route, NavLink } from 'react-router-dom';
import { useMemo, useState } from 'react';

import DashboardPage from './features/dashboard/DashboardPage';
import SavedCitiesPage from './features/saved/SavedCitiesPage';
import CityPage from './features/city/CityPage';
import AlertsPage from './features/alerts/AlertsPage';

import AlertsIndicator from './components/AlertsIndicator';
import LocationPickerDrawer from './components/LocationPickerDrawer';

import { Sun, MapPin } from 'lucide-react';
import { useActiveLocation } from './hooks/useActiveLocation';
import { useSavedCities } from './hooks/useSavedCities';

function Nav() {
  const base =
    'rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/10';
  const active = 'bg-white/15';
  return (
    <nav className='flex gap-2'>
      <NavLink
        to='/'
        className={({ isActive }) => `${base} ${isActive ? active : ''}`}
      >
        Home
      </NavLink>
      <NavLink
        to='/saved'
        className={({ isActive }) => `${base} ${isActive ? active : ''}`}
      >
        Saved
      </NavLink>
      <NavLink
        to='/alerts'
        className={({ isActive }) => `${base} ${isActive ? active : ''}`}
      >
        Alerts
      </NavLink>
    </nav>
  );
}

export default function App() {
  const [locationOpen, setLocationOpen] = useState(false);

  const { active } = useActiveLocation();
  const { cities } = useSavedCities();

  const locationLabel = useMemo(() => {
    if (active.kind === 'geo') return 'Current location';
    if (active.kind === 'fallback') return 'Kansas City';

    const c = cities.find((x) => x.id === active.cityId);
    if (!c) return 'Saved city';
    return c.name;
  }, [active, cities]);

  return (
    <div className='min-h-screen text-white'>
      <div className='fixed inset-0 -z-10 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950' />

      <header className='mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4'>
        <div className='flex items-center gap-3'>
          <div className='h-9 w-9 flex items-center justify-center rounded-2xl bg-white/10 text-accent2'>
            <Sun />
          </div>
          <div className='leading-tight'>
            <div className='text-sm opacity-80'>ReactWeather</div>
            <div className='text-lg font-semibold'>A Cool App</div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setLocationOpen(true)}
            className='inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15'
            title='Choose location'
          >
            <MapPin size={16} className='text-white/70' />
            {locationLabel}
          </button>

          <AlertsIndicator />
        </div>

        <Nav />
      </header>

      <main className='mx-auto w-full max-w-5xl px-4 pb-10'>
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
