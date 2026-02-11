import type { WeatherSnapshot } from '../api/schemas';

type Alert = NonNullable<WeatherSnapshot['alerts']>[number];

export default function AlertsBanner({ data }: { data: WeatherSnapshot }) {
  const alerts = data.alerts ?? [];

  if (alerts.length === 0) return null;

  return (
    <div className='rounded-3xl bg-amber-500/10 p-4 ring-1 ring-amber-400/20'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <div className='text-sm font-semibold text-amber-100'>
            Weather Alerts
          </div>
          <div className='text-xs text-amber-100/70'>
            {alerts.length} active alert{alerts.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className='rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-100 ring-1 ring-amber-300/20'>
          Active
        </div>
      </div>

      <div className='mt-3 space-y-2'>
        {alerts.map((a: Alert) => (
          <div
            key={a.id}
            className='rounded-2xl bg-black/20 p-3 ring-1 ring-white/10'
          >
            <div className='text-sm font-medium text-white/90'>{a.title}</div>

            <div className='mt-1 text-xs text-white/70'>
              Severity: <span className='text-white/80'>{a.severity}</span>
            </div>

            {a.description ? (
              <div className='mt-2 text-xs text-white/70 line-clamp-3'>
                {a.description}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
