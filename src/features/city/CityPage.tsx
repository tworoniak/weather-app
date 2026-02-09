import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchWeatherByCity } from '../../api/weather';
import ForecastCharts from '../../components/ForecastCharts';
import AlertsBanner from '../../components/AlertsBanner';

export default function CityPage() {
  const { id } = useParams<{ id: string }>();

  const q = useQuery({
    queryKey: ['weather', 'city', id],
    queryFn: () => fetchWeatherByCity(id!),
    enabled: !!id,
  });

  if (q.isLoading) return <div className='text-white/70'>Loading city…</div>;
  if (q.isError || !q.data)
    return <div className='text-white/70'>Could not load city.</div>;

  return (
    <div className='space-y-4'>
      <div className='rounded-3xl bg-white/5 p-5 ring-1 ring-white/10'>
        <div className='text-xs text-white/70'>City</div>
        <h1 className='text-xl font-semibold'>{q.data.placeName}</h1>
        <div className='mt-2 text-4xl font-semibold'>
          {Math.round(q.data.current.temp)}°
        </div>
        <div className='mt-1 text-sm text-white/80'>
          {q.data.current.condition}
        </div>
      </div>

      <AlertsBanner data={q.data} />
      <ForecastCharts data={q.data} />
    </div>
  );
}
