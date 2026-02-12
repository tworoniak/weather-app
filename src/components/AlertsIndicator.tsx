import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useActiveAlertsCount } from '../hooks/useActiveAlertsCount';

export default function AlertsIndicator() {
  const count = useActiveAlertsCount();

  if (count <= 0) {
    return (
      <div className='inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/60 ring-1 ring-white/10'>
        <AlertTriangle size={14} />
        No alerts
      </div>
    );
  }

  return (
    <Link
      to='/'
      className='inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-100 ring-1 ring-red-400/25 hover:bg-red-500/20'
      title='Active weather alerts'
    >
      <span className='relative flex h-2.5 w-2.5'>
        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60' />
        <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400' />
      </span>
      <AlertTriangle size={14} />
      {count} alert{count === 1 ? '' : 's'}
    </Link>
  );
}
