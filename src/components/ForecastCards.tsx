import { useMemo } from 'react';
import type { WeatherSnapshot } from '../api/schemas';
import { conditionToScene } from '../utils/conditionToScene';

type Props = {
  data: WeatherSnapshot;
};

function dayLabel(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString([], { weekday: 'short' });
}

function iconFor(scene: ReturnType<typeof conditionToScene>) {
  // lightweight emoji icons (fast “wow”). Swap for lucide later if you want.
  switch (scene) {
    case 'clear-day':
      return '☀️';
    case 'clear-night':
      return '🌙';
    case 'cloudy':
      return '☁️';
    case 'rain':
      return '🌧️';
    case 'snow':
      return '❄️';
    case 'fog':
      return '🌫️';
    case 'thunder':
      return '⛈️';
    default:
      return '🌡️';
  }
}

export default function ForecastCards({ data }: Props) {
  const cards = useMemo(() => {
    return (data.daily ?? []).slice(0, 7).map((d) => {
      const scene = conditionToScene(d.condition, true);
      return {
        key: d.date,
        day: dayLabel(d.date),
        icon: iconFor(scene),
        high: d.tempHigh,
        low: d.tempLow,
        precip: d.precipChance,
        condition: d.condition,
      };
    });
  }, [data.daily]);

  if (cards.length === 0) return null;

  return (
    <div className='rounded-3xl bg-black/20 p-4 ring-1 ring-white/10'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <div className='text-sm font-semibold'>Next 7 Days</div>
          <div className='text-xs text-white/60'>High / low + precip</div>
        </div>
        <div className='text-xs text-white/50'>Scroll</div>
      </div>

      <div className='mt-3 -mx-1 overflow-x-auto pb-2'>
        <div className='flex snap-x snap-mandatory gap-3 px-1'>
          {cards.map((c) => (
            <div
              key={c.key}
              className='w-32 shrink-0 snap-start rounded-3xl bg-white/5 p-3 ring-1 ring-white/10'
              title={c.condition}
            >
              <div className='flex items-center justify-between'>
                <div className='text-xs text-white/70'>{c.day}</div>
                <div className='text-lg leading-none'>{c.icon}</div>
              </div>

              <div className='mt-2'>
                <div className='text-sm font-semibold'>
                  {Math.round(c.high)}°{' '}
                  <span className='text-white/60'>/ {Math.round(c.low)}°</span>
                </div>

                <div className='mt-1 text-xs text-white/60'>
                  {typeof c.precip === 'number'
                    ? `Precip ${Math.round(c.precip)}%`
                    : 'Precip —'}
                </div>
              </div>

              <div className='mt-2 line-clamp-1 text-[11px] text-white/55'>
                {c.condition}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
