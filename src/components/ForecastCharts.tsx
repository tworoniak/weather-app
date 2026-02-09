import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { WeatherSnapshot } from '../api/schemas';

export default function ForecastCharts({ data }: { data: WeatherSnapshot }) {
  const chartData = data.daily.map((d) => ({
    day: d.date.slice(5),
    high: d.tempHigh,
    low: d.tempLow,
    precip: d.precipChance ?? 0,
  }));

  return (
    <div className='rounded-3xl bg-white/5 p-4 ring-1 ring-white/10'>
      <div className='mb-3 flex items-baseline justify-between'>
        <h2 className='text-base font-semibold'>7-Day Temps</h2>
        <div className='text-xs text-white/70'>High / Low</div>
      </div>

      <div className='h-56 w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={chartData}>
            <XAxis dataKey='day' />
            <YAxis />
            <Tooltip />
            <Line type='monotone' dataKey='high' strokeWidth={2} dot={false} />
            <Line type='monotone' dataKey='low' strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
