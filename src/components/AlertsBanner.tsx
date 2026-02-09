import { useState } from 'react';
import type { WeatherSnapshot } from '../api/schemas';

export default function AlertsBanner({ data }: { data: WeatherSnapshot }) {
  const alerts = data.alerts ?? [];
  const [open, setOpen] = useState(true);

  if (!alerts.length || !open) return null;

  return (
    <div className='mb-4 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <div className='text-sm font-semibold'>Severe Weather Alerts</div>
          <div className='text-xs text-white/70'>{alerts.length} active</div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className='rounded-xl bg-white/10 px-3 py-1 text-xs hover:bg-white/15'
        >
          Dismiss
        </button>
      </div>

      <div className='mt-3 space-y-3'>
        {alerts.map((a) => (
          <div key={a.id} className='rounded-2xl bg-black/20 p-3'>
            <div className='text-sm font-medium'>{a.title}</div>
            {a.severity ? (
              <div className='text-xs text-white/70'>
                Severity: {a.severity}
              </div>
            ) : null}
            {a.description ? (
              <p className='mt-2 text-sm text-white/80'>{a.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
