import { useMemo, useState } from 'react';
import type { WeatherAlert, WeatherSnapshot } from '../api/schemas';
import {
  AlertTriangle,
  ShieldAlert,
  Siren,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function severityRank(sev: WeatherAlert['severity']) {
  switch (sev) {
    case 'Extreme':
      return 0;
    case 'Severe':
      return 1;
    case 'Moderate':
      return 2;
    case 'Minor':
      return 3;
    default:
      return 4;
  }
}

function renderSeverityIcon(sev: WeatherAlert['severity']) {
  switch (sev) {
    case 'Extreme':
      return <Siren size={14} />;
    case 'Severe':
      return <ShieldAlert size={14} />;
    case 'Moderate':
      return <AlertTriangle size={14} />;
    case 'Minor':
      return <Info size={14} />;
    default:
      return <Info size={14} />;
  }
}

function severityStyles(sev: WeatherAlert['severity']) {
  switch (sev) {
    case 'Extreme':
      return {
        wrap: 'bg-red-500/10 ring-red-400/25',
        pill: 'bg-red-500/15 ring-red-300/25 text-red-100',
        glow: 'bg-red-500/15',
        pulse: true,
        label: 'Extreme',
      };
    case 'Severe':
      return {
        wrap: 'bg-orange-500/10 ring-orange-400/25',
        pill: 'bg-orange-500/15 ring-orange-300/25 text-orange-100',
        glow: 'bg-orange-500/15',
        pulse: true,
        label: 'Severe',
      };
    case 'Moderate':
      return {
        wrap: 'bg-amber-500/10 ring-amber-400/25',
        pill: 'bg-amber-500/15 ring-amber-300/25 text-amber-100',
        glow: 'bg-amber-500/10',
        pulse: false,
        label: 'Moderate',
      };
    case 'Minor':
      return {
        wrap: 'bg-sky-500/10 ring-sky-400/25',
        pill: 'bg-sky-500/15 ring-sky-300/25 text-sky-100',
        glow: 'bg-sky-500/10',
        pulse: false,
        label: 'Minor',
      };
    default:
      return {
        wrap: 'bg-white/5 ring-white/10',
        pill: 'bg-white/10 ring-white/10 text-white/80',
        glow: 'bg-white/5',
        pulse: false,
        label: 'Unknown',
      };
  }
}

function formatTime(ts?: number) {
  if (!ts) return null;
  const d = new Date(ts);
  return d.toLocaleString([], {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function timeUntil(ts?: number) {
  if (!ts) return null;
  const ms = ts - Date.now();
  if (!Number.isFinite(ms)) return null;

  if (ms <= 0) return 'Expired';

  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function safeText(s?: string) {
  const t = s?.trim();
  return t ? t : null;
}

function stripLongWhitespace(s: string) {
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

function isExpired(a: WeatherAlert) {
  if (!a.expires) return false;
  return a.expires <= Date.now();
}

export default function AlertsBanner({ data }: { data: WeatherSnapshot }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const alerts = useMemo(() => data.alerts ?? [], [data.alerts]);

  const sorted = useMemo(() => {
    const active = alerts.filter((a) => !isExpired(a));

    return [...active].sort((a, b) => {
      const r = severityRank(a.severity) - severityRank(b.severity);
      if (r !== 0) return r;

      const ae = a.expires ?? Number.POSITIVE_INFINITY;
      const be = b.expires ?? Number.POSITIVE_INFINITY;
      return ae - be;
    });
  }, [alerts]);

  const top = sorted[0];

  if (sorted.length === 0) return null;

  const list = showAll ? sorted : sorted.slice(0, 1);

  if (sorted.length === 1 && !showAll && top) {
    return (
      <CompactAlertToast
        alert={top}
        isOpen={openId === top.id}
        onToggle={() => setOpenId(openId === top.id ? null : top.id)}
      />
    );
  }

  return (
    <div className='rounded-3xl bg-black/20 p-4 ring-1 ring-white/10'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <div className='text-sm font-semibold text-white/90'>
            Weather Alerts
          </div>
          <div className='text-xs text-white/60'>
            {sorted.length} active alert{sorted.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          {top ? (
            <div
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${severityStyles(top.severity).pill}`}
              title={top.title}
            >
              Most Severe: {top.severity}
            </div>
          ) : null}

          <div className='rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10'>
            Live (NWS)
          </div>
        </div>
      </div>

      <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='text-xs text-white/60'>
          Showing {list.length} of {sorted.length}
        </div>

        {sorted.length > 1 ? (
          <button
            type='button'
            onClick={() => setShowAll((s) => !s)}
            className='rounded-2xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/15'
          >
            {showAll ? 'Show less' : 'View all'}
          </button>
        ) : null}
      </div>

      <div className='mt-3 space-y-2'>
        {list.map((a) => (
          <AlertCard
            key={a.id}
            alert={a}
            isOpen={openId === a.id}
            onToggle={() => setOpenId(openId === a.id ? null : a.id)}
          />
        ))}
      </div>
    </div>
  );
}

function CompactAlertToast({
  alert,
  isOpen,
  onToggle,
}: {
  alert: WeatherAlert;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const s = severityStyles(alert.severity);

  const expiresStr = formatTime(alert.expires);
  const until = timeUntil(alert.expires);

  const headline = safeText(alert.headline) ?? safeText(alert.areaDesc);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-4 ring-1 ${s.wrap}`}
    >
      <div
        className={[
          'pointer-events-none absolute -inset-8 blur-2xl',
          s.glow,
          s.pulse ? 'animate-pulse' : '',
        ].join(' ')}
      />

      <div className='relative flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${s.pill}`}
            >
              {renderSeverityIcon(alert.severity)}
              {s.label}
            </span>
            <div className='text-sm font-semibold text-white/90'>
              {alert.title}
            </div>
          </div>

          {headline ? (
            <div className='mt-1 text-xs text-white/70'>{headline}</div>
          ) : null}

          <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60'>
            <span>
              Urgency: <span className='text-white/75'>{alert.urgency}</span>
            </span>
            <span>
              Certainty:{' '}
              <span className='text-white/75'>{alert.certainty}</span>
            </span>

            {expiresStr ? (
              <span>
                Expires: <span className='text-white/75'>{expiresStr}</span>
                {until ? (
                  <span className='text-white/55'> ({until})</span>
                ) : null}
              </span>
            ) : null}
          </div>
        </div>

        <div className='flex shrink-0 items-center gap-2'>
          <button
            type='button'
            onClick={onToggle}
            className='inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/15'
          >
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isOpen ? 'Hide' : 'Details'}
          </button>

          {alert.link ? (
            <a
              href={alert.link}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/10 hover:bg-white/10'
              title='Open NWS link'
            >
              <ExternalLink size={14} />
              Link
            </a>
          ) : null}
        </div>
      </div>

      {isOpen ? (
        <div className='relative mt-3 space-y-3'>
          {safeText(alert.description) ? (
            <div className='rounded-2xl bg-black/20 p-3 text-xs text-white/75 ring-1 ring-white/10 whitespace-pre-wrap'>
              {stripLongWhitespace(alert.description ?? '')}
            </div>
          ) : null}

          {safeText(alert.instruction) ? (
            <div className='rounded-2xl bg-black/20 p-3 text-xs text-white/75 ring-1 ring-white/10 whitespace-pre-wrap'>
              <div className='mb-1 text-[11px] font-semibold text-white/85'>
                Instructions
              </div>
              {stripLongWhitespace(alert.instruction ?? '')}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AlertCard({
  alert,
  isOpen,
  onToggle,
}: {
  alert: WeatherAlert;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const s = severityStyles(alert.severity);

  const effectiveStr = formatTime(alert.effective);
  const expiresStr = formatTime(alert.expires);
  const until = timeUntil(alert.expires);

  const headline = safeText(alert.headline);
  const desc = safeText(alert.description);
  const instruction = safeText(alert.instruction);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-3 ring-1 ${s.wrap}`}
    >
      <div
        className={[
          'pointer-events-none absolute -inset-8 blur-2xl',
          s.glow,
          s.pulse ? 'animate-pulse' : '',
        ].join(' ')}
      />

      <div className='relative flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${s.pill}`}
            >
              {renderSeverityIcon(alert.severity)}
              {s.label}
            </span>

            <div className='text-sm font-semibold text-white/90'>
              {alert.title}
            </div>
          </div>

          {headline ? (
            <div className='mt-1 text-xs text-white/70'>{headline}</div>
          ) : null}

          {alert.areaDesc ? (
            <div className='mt-1 text-xs text-white/55'>
              Area: {alert.areaDesc}
            </div>
          ) : null}

          <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60'>
            <span>
              Urgency: <span className='text-white/75'>{alert.urgency}</span>
            </span>
            <span>
              Certainty:{' '}
              <span className='text-white/75'>{alert.certainty}</span>
            </span>

            {expiresStr ? (
              <span>
                Expires: <span className='text-white/75'>{expiresStr}</span>
                {until ? (
                  <span className='text-white/55'> ({until})</span>
                ) : null}
              </span>
            ) : null}

            {effectiveStr ? (
              <span>
                Effective: <span className='text-white/75'>{effectiveStr}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className='relative flex shrink-0 flex-col items-end gap-2'>
          <button
            type='button'
            onClick={onToggle}
            className='inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/15'
          >
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isOpen ? 'Hide' : 'Details'}
          </button>

          {alert.link ? (
            <a
              href={alert.link}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/10 hover:bg-white/10'
            >
              <ExternalLink size={14} />
              NWS
            </a>
          ) : null}
        </div>
      </div>

      {isOpen ? (
        <div className='relative mt-3 space-y-3'>
          {desc ? (
            <div className='rounded-2xl bg-black/20 p-3 text-xs text-white/75 ring-1 ring-white/10 whitespace-pre-wrap'>
              {stripLongWhitespace(desc)}
            </div>
          ) : null}

          {instruction ? (
            <div className='rounded-2xl bg-black/20 p-3 text-xs text-white/75 ring-1 ring-white/10 whitespace-pre-wrap'>
              <div className='mb-1 text-[11px] font-semibold text-white/85'>
                Instructions
              </div>
              {stripLongWhitespace(instruction)}
            </div>
          ) : null}

          {alert.sender ? (
            <div className='text-[11px] text-white/55'>
              Sender: {alert.sender}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
