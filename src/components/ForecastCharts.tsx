import { useMemo, useState } from 'react';
import type { WeatherSnapshot } from '../api/schemas';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type View = 'daily' | 'hourly';
type HourlyMode = 'temp' | 'precip' | 'wind';

function dayLabel(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString([], { weekday: 'short' });
}

function hourLabel(isoTime: string) {
  const d = new Date(isoTime);
  return d.toLocaleTimeString([], { hour: 'numeric' });
}

function fullHourLabel(isoTime: string) {
  const d = new Date(isoTime);
  return d.toLocaleString([], {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ForecastCharts({ data }: { data: WeatherSnapshot }) {
  const [view, setView] = useState<View>('daily');
  const [mode, setMode] = useState<HourlyMode>('temp');

  const daily = useMemo(() => {
    return (data.daily ?? []).map((d) => ({
      day: dayLabel(d.date),
      high: d.tempHigh,
      low: d.tempLow,
    }));
  }, [data.daily]);

  const hourly = useMemo(() => {
    const pts = data.hourly ?? [];
    return pts.slice(0, 48).map((p) => ({
      hour: hourLabel(p.time),
      fullLabel: fullHourLabel(p.time), // ✅ used for tooltip label, no payload digging
      temp: p.temp ?? null,
      precip: p.precipChance ?? null,
      wind: p.wind ?? null,
    }));
  }, [data.hourly]);

  const hourlyKey: Record<HourlyMode, 'temp' | 'precip' | 'wind'> = {
    temp: 'temp',
    precip: 'precip',
    wind: 'wind',
  };

  const hourlyUnit: Record<HourlyMode, string> = {
    temp: '°F',
    precip: '%',
    wind: 'mph',
  };

  return (
    <div className='rounded-3xl bg-black/20 p-4 ring-1 ring-white/10'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <div className='text-sm font-semibold'>
            {view === 'daily' ? '7-Day High / Low' : 'Hourly Forecast'}
          </div>
          <div className='text-xs text-white/60'>
            {view === 'daily' ? 'Next 7 days' : 'Next 48 hours'}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setView('daily')}
            className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
              view === 'daily'
                ? 'bg-white/15 text-white ring-white/20'
                : 'bg-white/5 text-white/70 ring-white/10 hover:bg-white/10'
            }`}
          >
            Daily
          </button>
          <button
            type='button'
            onClick={() => setView('hourly')}
            className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
              view === 'hourly'
                ? 'bg-white/15 text-white ring-white/20'
                : 'bg-white/5 text-white/70 ring-white/10 hover:bg-white/10'
            }`}
          >
            Hourly
          </button>
        </div>
      </div>

      {view === 'hourly' ? (
        <div className='mt-3 flex flex-wrap items-center gap-2'>
          {(['temp', 'precip', 'wind'] as const).map((m) => (
            <button
              key={m}
              type='button'
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
                mode === m
                  ? 'bg-white/15 text-white ring-white/20'
                  : 'bg-white/5 text-white/70 ring-white/10 hover:bg-white/10'
              }`}
            >
              {m === 'temp' ? 'Temp' : m === 'precip' ? 'Precip' : 'Wind'}
            </button>
          ))}
        </div>
      ) : null}

      {view === 'daily' ? (
        daily.length === 0 ? (
          <div className='mt-4 text-sm text-white/70'>No daily data.</div>
        ) : (
          <div className='mt-4 h-56'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={daily} margin={{ left: 8, right: 8, top: 10 }}>
                <CartesianGrid strokeOpacity={0.2} />
                <XAxis dataKey='day' tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={40} />
                <Tooltip
                  formatter={(value: unknown, name: unknown) => {
                    const label =
                      name === 'high'
                        ? 'High'
                        : name === 'low'
                          ? 'Low'
                          : 'Value';

                    return typeof value === 'number'
                      ? [`${Math.round(value)}°`, label]
                      : ['—', label];
                  }}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.92)', // slate-ish
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '14px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                    padding: '10px 12px',
                  }}
                  labelStyle={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                  itemStyle={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type='monotone'
                  dataKey='high'
                  stroke='#f97316'
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type='monotone'
                  dataKey='low'
                  stroke='#38bdf8'
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      ) : hourly.length === 0 ? (
        <div className='mt-4 text-sm text-white/70'>
          No hourly data yet (check API hourly fields).
        </div>
      ) : (
        <div className='mt-4 h-56'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={hourly} margin={{ left: 8, right: 8, top: 10 }}>
              <CartesianGrid strokeOpacity={0.2} />
              <XAxis
                dataKey='fullLabel'
                tick={{ fontSize: 12 }}
                interval={3}
                tickFormatter={(_, index) => hourly[index]?.hour ?? ''}
              />
              <YAxis tick={{ fontSize: 12 }} width={40} />
              <Tooltip
                labelFormatter={(label: unknown) =>
                  typeof label === 'string' ? label : ''
                }
                formatter={(value: unknown) =>
                  typeof value === 'number'
                    ? [`${Math.round(value)}${hourlyUnit[mode]}`, '']
                    : ['—', '']
                }
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.92)', // slate-ish
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '14px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                  padding: '10px 12px',
                }}
                labelStyle={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
                itemStyle={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '12px',
                }}
              />
              <Line
                type='monotone'
                dataKey={hourlyKey[mode]}
                stroke={
                  mode === 'temp'
                    ? '#f97316'
                    : mode === 'precip'
                      ? '#38bdf8'
                      : '#a78bfa'
                }
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
