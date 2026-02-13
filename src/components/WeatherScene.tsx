import React, { useEffect, useMemo, useRef } from 'react';
import { conditionToScene, type SceneId } from '../utils/conditionToScene';

export default function WeatherScene({
  condition,
  isDay = true,
}: {
  condition: string;
  isDay?: boolean;
}) {
  const scene = useMemo<SceneId>(
    () => conditionToScene(condition, isDay),
    [condition, isDay],
  );

  return (
    // ✅ make this background-friendly (no rounding). Your page should place it with absolute inset-0 -z-10
    <div className='pointer-events-none absolute inset-0 overflow-hidden'>
      {/* Scene stack (crossfade by opacity) */}
      <SceneLayer active={scene === 'clear-day'}>
        <ClearDay />
      </SceneLayer>

      <SceneLayer active={scene === 'clear-night'}>
        <ClearNight />
      </SceneLayer>

      <SceneLayer active={scene === 'cloudy'}>
        <Cloudy />
      </SceneLayer>

      <SceneLayer active={scene === 'rain'}>
        <Rain />
      </SceneLayer>

      <SceneLayer active={scene === 'snow'}>
        <Snow />
      </SceneLayer>

      <SceneLayer active={scene === 'fog'}>
        <Fog />
      </SceneLayer>

      <SceneLayer active={scene === 'thunder'}>
        <Thunder />
      </SceneLayer>

      {/* Foreground veil to improve contrast */}
      <div className='absolute inset-0 bg-linear-to-b from-black/20 via-black/10 to-black/35' />

      <SceneStyles />
    </div>
  );
}

function SceneLayer({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        'absolute inset-0 transition-opacity duration-700',
        active ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

/* ------------------ RAIN PARTICLES (CANVAS) ------------------ */

function RainParticles({ enabled = true }: { enabled?: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const drops = Array.from({ length: 160 }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      len: 0.08 + Math.random() * 0.14,
      speed: 0.35 + Math.random() * 0.95,
      thick: 1 + Math.random() * 1.5,
      alpha: 0.14 + Math.random() * 0.25,
    }));

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      for (const d of drops) {
        d.y += d.speed * 0.012;
        d.x += d.speed * 0.004;

        if (d.y > 1.1) {
          d.y = -0.1;
          d.x = Math.random();
        }
        if (d.x > 1.1) d.x = -0.1;

        const x = d.x * w;
        const y = d.y * h;

        const dx = 12; // slant
        const dy = d.len * h;

        ctx.strokeStyle = `rgba(255,255,255,${d.alpha})`;
        ctx.lineWidth = d.thick;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enabled]);

  return (
    <canvas
      ref={ref}
      className='absolute inset-0 h-full w-full'
      aria-hidden='true'
    />
  );
}

/* ------------------ SCENES ------------------ */

function ClearDay() {
  return (
    <div className='absolute inset-0'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%),linear-gradient(135deg,rgba(56,189,248,0.35),rgba(34,211,238,0.10),rgba(167,139,250,0.10))]' />
      <div className='absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/25 blur-2xl scene-sun' />
      <div className='absolute inset-0 scene-grain opacity-20' />
    </div>
  );
}

function ClearNight() {
  return (
    <div className='absolute inset-0'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.75),rgba(2,6,23,0.95))]' />
      <Stars />
      <div className='absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-200/15 blur-2xl scene-moon' />
      <div className='absolute inset-0 scene-grain opacity-25' />
    </div>
  );
}

function Cloudy() {
  return (
    <div className='absolute inset-0'>
      <div className='absolute inset-0 bg-[linear-gradient(135deg,rgba(148,163,184,0.25),rgba(30,41,59,0.55))]' />

      {/* ✅ add parallax cloud layers for more “wow” */}
      <div className='absolute inset-0 scene-clouds' />
      <div className='absolute inset-0 scene-clouds scene-clouds-slow opacity-70' />
      <div className='absolute inset-0 scene-clouds scene-clouds-fast opacity-50' />

      <div className='absolute inset-0 scene-grain opacity-25' />
    </div>
  );
}

function Rain() {
  return (
    <div className='absolute inset-0'>
      <div className='absolute inset-0 bg-[linear-gradient(135deg,rgba(30,41,59,0.75),rgba(2,6,23,0.85))]' />

      {/* clouds */}
      <div className='absolute inset-0 scene-clouds opacity-80' />
      <div className='absolute inset-0 scene-clouds scene-clouds-slow opacity-60' />

      {/* ✅ REPLACED: CSS repeating rain → canvas particles */}
      <RainParticles />

      <div className='absolute inset-0 scene-grain opacity-30' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(56,189,248,0.12),transparent_55%)]' />
    </div>
  );
}

function Snow() {
  return (
    <div className='absolute inset-0'>
      <div className='absolute inset-0 bg-[linear-gradient(135deg,rgba(148,163,184,0.25),rgba(15,23,42,0.75))]' />
      <div className='absolute inset-0 scene-clouds opacity-70' />
      <div className='absolute inset-0 scene-snow' />
      <div className='absolute inset-0 scene-grain opacity-25' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),transparent_55%)]' />
    </div>
  );
}

function Fog() {
  return (
    <div className='absolute inset-0'>
      <div className='absolute inset-0 bg-[linear-gradient(135deg,rgba(71,85,105,0.45),rgba(2,6,23,0.75))]' />
      <div className='absolute inset-0 scene-fog' />
      <div className='absolute inset-0 scene-grain opacity-25' />
    </div>
  );
}

function Thunder() {
  return (
    <div className='absolute inset-0'>
      <div className='absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.92),rgba(15,23,42,0.85))]' />
      <div className='absolute inset-0 scene-clouds opacity-85' />
      {/* you can swap this to RainParticles too if you want */}
      <RainParticles />
      <div className='absolute inset-0 scene-lightning' />
      <div className='absolute inset-0 scene-grain opacity-35' />
    </div>
  );
}

/* ------------------ EXTRAS ------------------ */

function Stars() {
  return (
    <div
      className='absolute inset-0 opacity-70'
      style={{
        backgroundImage: [
          'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.85) 50%, transparent 51%)',
          'radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.75) 50%, transparent 51%)',
          'radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.70) 50%, transparent 51%)',
          'radial-gradient(1px 1px at 85% 60%, rgba(255,255,255,0.65) 50%, transparent 51%)',
          'radial-gradient(1px 1px at 10% 80%, rgba(255,255,255,0.60) 50%, transparent 51%)',
        ].join(','),
      }}
    />
  );
}

/* ------------------ STYLES ------------------ */

function SceneStyles() {
  return (
    <style>{`
      .scene-grain {
        background-image:
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
        background-size: 180px 180px;
        mix-blend-mode: overlay;
        animation: grainMove 7s linear infinite;
      }

      @keyframes grainMove {
        0% { transform: translate3d(0,0,0); }
        25% { transform: translate3d(-2%, 1%, 0); }
        50% { transform: translate3d(2%, -1%, 0); }
        75% { transform: translate3d(-1%, -2%, 0); }
        100% { transform: translate3d(0,0,0); }
      }

      .scene-clouds {
        background-image:
          radial-gradient(closest-side at 20% 35%, rgba(255,255,255,0.10), transparent 65%),
          radial-gradient(closest-side at 50% 30%, rgba(255,255,255,0.08), transparent 70%),
          radial-gradient(closest-side at 80% 40%, rgba(255,255,255,0.10), transparent 65%),
          radial-gradient(closest-side at 30% 65%, rgba(255,255,255,0.06), transparent 70%),
          radial-gradient(closest-side at 70% 70%, rgba(255,255,255,0.07), transparent 72%);
        filter: blur(2px);
        animation: cloudsDrift 20s linear infinite;
        transform: translateZ(0);
      }

      /* ✅ parallax variants */
      .scene-clouds-slow { animation-duration: 34s; filter: blur(3px); transform: scale(1.08); }
      .scene-clouds-fast { animation-duration: 14s; filter: blur(1.5px); transform: scale(1.02); }

      @keyframes cloudsDrift {
        0%   { transform: translate3d(-4%, 0, 0); }
        100% { transform: translate3d(4%, 0, 0); }
      }

      .scene-snow {
        background-image:
          radial-gradient(2px 2px at 10% 15%, rgba(255,255,255,0.65) 50%, transparent 51%),
          radial-gradient(2px 2px at 30% 35%, rgba(255,255,255,0.55) 50%, transparent 51%),
          radial-gradient(1.5px 1.5px at 60% 20%, rgba(255,255,255,0.55) 50%, transparent 51%),
          radial-gradient(2px 2px at 80% 40%, rgba(255,255,255,0.60) 50%, transparent 51%),
          radial-gradient(1.5px 1.5px at 50% 70%, rgba(255,255,255,0.50) 50%, transparent 51%),
          radial-gradient(2px 2px at 15% 80%, rgba(255,255,255,0.55) 50%, transparent 51%),
          radial-gradient(1.5px 1.5px at 85% 85%, rgba(255,255,255,0.45) 50%, transparent 51%);
        background-size: 220px 220px;
        animation: snowFall 4.5s linear infinite;
        opacity: 0.9;
      }

      @keyframes snowFall {
        0%   { background-position: 0px -40px; transform: translate3d(0,0,0); }
        100% { background-position: 0px 220px; transform: translate3d(6px, 0, 0); }
      }

      .scene-fog {
        background-image:
          radial-gradient(closest-side at 30% 60%, rgba(255,255,255,0.16), transparent 70%),
          radial-gradient(closest-side at 70% 55%, rgba(255,255,255,0.12), transparent 72%),
          radial-gradient(closest-side at 50% 80%, rgba(255,255,255,0.10), transparent 75%);
        filter: blur(6px);
        animation: fogDrift 14s ease-in-out infinite;
        opacity: 0.95;
      }

      @keyframes fogDrift {
        0%   { transform: translate3d(-3%, 0, 0); }
        50%  { transform: translate3d(3%, -1%, 0); }
        100% { transform: translate3d(-3%, 0, 0); }
      }

      .scene-lightning {
        background: rgba(255,255,255,0);
        animation: lightning 6.5s infinite;
        mix-blend-mode: screen;
      }

      @keyframes lightning {
        0%, 72%, 100% { background: rgba(255,255,255,0); }
        74% { background: rgba(255,255,255,0.10); }
        74.6% { background: rgba(255,255,255,0.00); }
        76% { background: rgba(255,255,255,0.16); }
        76.4% { background: rgba(255,255,255,0.00); }
      }

      .scene-sun { animation: floaty 6s ease-in-out infinite; }
      .scene-moon { animation: floaty 8s ease-in-out infinite; }

      @keyframes floaty {
        0%, 100% { transform: translate3d(0,0,0); }
        50% { transform: translate3d(0, 10px, 0); }
      }
    `}</style>
  );
}
