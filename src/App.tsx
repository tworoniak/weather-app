import { Routes, Route, NavLink } from 'react-router-dom';
import DashboardPage from './features/dashboard/DashboardPage';
import SavedCitiesPage from './features/saved/SavedCitiesPage';
import CityPage from './features/city/CityPage';
import AlertsIndicator from './components/AlertsIndicator';

import { Sun } from 'lucide-react';

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
    </nav>
  );
}

export default function App() {
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
            <div className='text-lg font-semibold'>But Actually Cool</div>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <AlertsIndicator />
        </div>

        <Nav />
      </header>

      <main className='mx-auto w-full max-w-5xl px-4 pb-10'>
        <Routes>
          <Route path='/' element={<DashboardPage />} />
          <Route path='/saved' element={<SavedCitiesPage />} />
          <Route path='/city/:id' element={<CityPage />} />
        </Routes>
      </main>
    </div>
  );
}
