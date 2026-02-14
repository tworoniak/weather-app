import React, { useEffect, useMemo, useRef } from 'react';
import { conditionToScene, type SceneId } from '../utils/conditionToScene';

export default function WeatherScene({
  condition,
  isDay = true,
  windMph = 0,
}: {
  condition: string;
  isDay?: boolean;
  windMph?: number;
}) {
  const scene = useMemo<SceneId>(
    () => conditionToScene(condition, isDay),
    [condition, isDay],
  );

  const wind = Number.isFinite(windMph) ? windMph : 0;

  // 0..1-ish intensity scaler (tune as you like)
  const wind01 = Math.max(0, Math.min(1, wind / 25));
  const rainAngleDeg = 105 + wind01 * 18; // 105..123 deg
  const cloudsSeconds = 26 - wind01 * 10; // 26s..16s
  const rainSeconds = 0.75 - wind01 * 0.25; // 0.75s..0.5s

  return (
    <div
      className='relative h-full w-full overflow-hidden'
      style={
        {
          // CSS custom props used by SceneStyles() + canvas particles
          ['--clouds-seconds' as unknown as keyof React.CSSProperties]: `${cloudsSeconds}s`,
          ['--rain-seconds' as unknown as keyof React.CSSProperties]: `${rainSeconds}s`,
          ['--rain-angle' as unknown as keyof React.CSSProperties]: `${rainAngleDeg}deg`,
        } as React.CSSProperties
      }
    >
      {/* Scene stack (crossfade by opacity) */}
      <SceneLayer active={scene === 'clear-day'}>
        <BaseGradient kind='clear-day' />
        <SunGlow />
      </SceneLayer>

      <SceneLayer active={scene === 'clear-night'}>
        <BaseGradient kind='clear-night' />
        <Stars />
        <MoonGlow />
      </SceneLayer>

      <SceneLayer active={scene === 'cloudy'}>
        <BaseGradient kind='cloudy' />
        <Clouds intensity='med' />
      </SceneLayer>

      <SceneLayer active={scene === 'rain'}>
        <BaseGradient kind='rain' />
        <Clouds intensity='high' />
        <RainParticles />
      </SceneLayer>

      <SceneLayer active={scene === 'snow'}>
        <BaseGradient kind='snow' />
        <Clouds intensity='med' />
        <SnowParticles />
      </SceneLayer>

      <SceneLayer active={scene === 'fog'}>
        <BaseGradient kind='fog' />
        <FogLayers />
      </SceneLayer>

      <SceneLayer active={scene === 'thunder'}>
        <BaseGradient kind='thunder' />
        <Clouds intensity='high' />
        <RainParticles />
        <LightningFlash />
      </SceneLayer>

      {/* Global contrast veil so UI stays readable */}
      <div className='pointer-events-none absolute inset-0 bg-linear-to-b from-black/20 via-black/10 to-black/35' />

      {/* Subtle grain helps scenes feel less “flat” */}
      <div className='pointer-events-none absolute inset-0 scene-grain opacity-25' />

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

/* ------------------ BASES ------------------ */

function BaseGradient({ kind }: { kind: SceneId }) {
  // Keep gradients simple; motion comes from clouds/particles.
  const cls =
    kind === 'clear-day'
      ? 'bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.30),transparent_48%),linear-gradient(135deg,rgba(56,189,248,0.35),rgba(34,211,238,0.10),rgba(167,139,250,0.10))]'
      : kind === 'clear-night'
        ? 'bg-[radial-gradient(circle_at_70%_25%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.70),rgba(2,6,23,0.95))]'
        : kind === 'cloudy'
          ? 'bg-[linear-gradient(135deg,rgba(148,163,184,0.18),rgba(30,41,59,0.55))]'
          : kind === 'rain'
            ? 'bg-[linear-gradient(135deg,rgba(30,41,59,0.75),rgba(2,6,23,0.90))]'
            : kind === 'snow'
              ? 'bg-[linear-gradient(135deg,rgba(148,163,184,0.20),rgba(15,23,42,0.80))]'
              : kind === 'fog'
                ? 'bg-[linear-gradient(135deg,rgba(71,85,105,0.40),rgba(2,6,23,0.80))]'
                : 'bg-[linear-gradient(135deg,rgba(2,6,23,0.92),rgba(15,23,42,0.88))]';

  return <div className={`absolute inset-0 ${cls}`} />;
}

function SunGlow() {
  return (
    <div className='pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/25 blur-3xl scene-float-slow' />
  );
}

function MoonGlow() {
  return (
    <div className='pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-indigo-200/14 blur-3xl scene-float-slower' />
  );
}

function Stars() {
  return (
    <div
      className='pointer-events-none absolute inset-0 opacity-70'
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

/* ------------------ CLOUDS (parallax) ------------------ */

function Clouds({ intensity }: { intensity: 'med' | 'high' }) {
  const a = intensity === 'high' ? 'opacity-55' : 'opacity-40';
  const b = intensity === 'high' ? 'opacity-45' : 'opacity-30';
  const c = intensity === 'high' ? 'opacity-35' : 'opacity-22';

  return (
    <div className='pointer-events-none absolute inset-0'>
      <div className={`absolute inset-0 scene-clouds-1 ${a}`} />
      <div className={`absolute inset-0 scene-clouds-2 ${b}`} />
      <div className={`absolute inset-0 scene-clouds-3 ${c}`} />
    </div>
  );
}

/* ------------------ FOG ------------------ */

function FogLayers() {
  return (
    <div className='pointer-events-none absolute inset-0'>
      <div className='absolute inset-0 scene-fog-1 opacity-70' />
      <div className='absolute inset-0 scene-fog-2 opacity-60' />
    </div>
  );
}

/* ------------------ LIGHTNING ------------------ */

function LightningFlash() {
  return (
    <div className='pointer-events-none absolute inset-0 scene-lightning' />
  );
}

/* ------------------ PARTICLES (canvas) ------------------ */

function useCanvasSize(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const parent = c.parentElement;
    if (!parent) return;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);

      c.width = Math.floor(rect.width * dpr);
      c.height = Math.floor(rect.height * dpr);
      c.style.width = `${rect.width}px`;
      c.style.height = `${rect.height}px`;
    };

    resize();

    const ro = new ResizeObserver(() => resize());
    ro.observe(parent);

    window.addEventListener('resize', resize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

type Drop = {
  x: number;
  y: number;
  vy: number;
  len: number;
  w: number;
};

function RainParticles() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useCanvasSize(ref);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (prefersReducedMotion()) return;

    const ctx = c.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    let raf = 0;
    let last = performance.now();

    const drops: Drop[] = [];
    const count = 120;

    const init = () => {
      drops.length = 0;
      const w = c.width;
      const h = c.height;

      for (let i = 0; i < count; i++) {
        drops.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vy: (800 + Math.random() * 900) * dpr,
          len: (10 + Math.random() * 16) * dpr,
          w: (1 + Math.random() * 0.8) * dpr,
        });
      }
    };

    init();

    const readVars = () => {
      const parent = c.parentElement;
      const cs = parent ? getComputedStyle(parent) : getComputedStyle(c);

      const angleStr = cs.getPropertyValue('--rain-angle').trim(); // "115deg"
      const secondsStr = cs.getPropertyValue('--rain-seconds').trim(); // "0.55s"

      const angle = Number.parseFloat(angleStr);
      const rainAngle = Number.isFinite(angle) ? angle : 115;

      const sec = Number.parseFloat(secondsStr);
      // speedMult > 1 means faster rain
      const speedMult = Number.isFinite(sec) && sec > 0 ? 0.55 / sec : 1;

      return { rainAngle, speedMult };
    };

    const step = (t: number) => {
      const dt = Math.min(0.033, (t - last) / 1000);
      last = t;

      const w = c.width;
      const h = c.height;

      const { rainAngle, speedMult } = readVars();
      const rad = (rainAngle * Math.PI) / 180;

      // Base velocity components (tune)
      const baseX = 260 * dpr * speedMult;
      const baseY = 1150 * dpr * speedMult;

      const dx = Math.cos(rad) * baseX;
      const dy = Math.sin(rad) * baseY;

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';

      for (const d of drops) {
        d.y += dy * dt;
        d.x += dx * dt;

        // recycle
        if (d.y - d.len > h || d.x > w + 60 * dpr || d.x < -60 * dpr) {
          d.y = -Math.random() * h * 0.2;
          d.x = Math.random() * w;
        }

        ctx.lineWidth = d.w;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);

        // draw opposite the direction of travel
        const lx = dx * 0.02;
        const ly = dy * 0.02;

        ctx.lineTo(d.x - lx, d.y - ly);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      className='pointer-events-none absolute inset-0 opacity-70'
      aria-hidden='true'
    />
  );
}

type Flake = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
};

function SnowParticles() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useCanvasSize(ref);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (prefersReducedMotion()) return;

    const ctx = c.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    let raf = 0;
    let last = performance.now();

    const flakes: Flake[] = [];
    const count = 90;

    const init = () => {
      flakes.length = 0;
      const w = c.width;
      const h = c.height;

      for (let i = 0; i < count; i++) {
        flakes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (1.2 + Math.random() * 2.2) * dpr,
          vx: (-30 + Math.random() * 60) * dpr,
          vy: (40 + Math.random() * 90) * dpr,
        });
      }
    };

    init();

    const step = (t: number) => {
      const dt = Math.min(0.033, (t - last) / 1000);
      last = t;

      const w = c.width;
      const h = c.height;

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';

      for (const f of flakes) {
        f.y += f.vy * dt;
        f.x +=
          f.vx * dt + Math.sin((t / 1000) * 1.2 + f.y * 0.002) * 18 * dpr * dt;

        if (f.y - f.r > h) {
          f.y = -Math.random() * h * 0.1;
          f.x = Math.random() * w;
        }
        if (f.x < -20 * dpr) f.x = w + 20 * dpr;
        if (f.x > w + 20 * dpr) f.x = -20 * dpr;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      className='pointer-events-none absolute inset-0 opacity-75'
      aria-hidden='true'
    />
  );
}

/* ------------------ CSS ------------------ */

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

      /* Cloud layers: parallax */
      .scene-clouds-1 {
        background-image:
          radial-gradient(closest-side at 20% 35%, rgba(255,255,255,0.16), transparent 68%),
          radial-gradient(closest-side at 55% 30%, rgba(255,255,255,0.12), transparent 72%),
          radial-gradient(closest-side at 85% 40%, rgba(255,255,255,0.16), transparent 68%);
        filter: blur(2px);
        transform: translateZ(0);
        animation: cloudsDrift1 var(--clouds-seconds, 26s) linear infinite;
      }
      .scene-clouds-2 {
        background-image:
          radial-gradient(closest-side at 30% 65%, rgba(255,255,255,0.12), transparent 72%),
          radial-gradient(closest-side at 70% 70%, rgba(255,255,255,0.10), transparent 74%),
          radial-gradient(closest-side at 50% 55%, rgba(255,255,255,0.08), transparent 76%);
        filter: blur(5px);
        transform: translateZ(0);
        animation: cloudsDrift2 calc(var(--clouds-seconds, 26s) * 1.45) linear infinite;
      }
      .scene-clouds-3 {
        background-image:
          radial-gradient(closest-side at 15% 55%, rgba(255,255,255,0.10), transparent 75%),
          radial-gradient(closest-side at 60% 45%, rgba(255,255,255,0.08), transparent 78%),
          radial-gradient(closest-side at 90% 60%, rgba(255,255,255,0.10), transparent 75%);
        filter: blur(9px);
        transform: translateZ(0);
        animation: cloudsDrift3 calc(var(--clouds-seconds, 26s) * 2.1) linear infinite;
      }

      @keyframes cloudsDrift1 {
        0% { transform: translate3d(-6%, 0, 0); }
        100% { transform: translate3d(6%, 0, 0); }
      }
      @keyframes cloudsDrift2 {
        0% { transform: translate3d(7%, 0, 0); }
        100% { transform: translate3d(-7%, 0, 0); }
      }
      @keyframes cloudsDrift3 {
        0% { transform: translate3d(-4%, 0, 0); }
        100% { transform: translate3d(4%, 0, 0); }
      }

      /* Fog layers */
      .scene-fog-1 {
        background-image:
          radial-gradient(closest-side at 30% 60%, rgba(255,255,255,0.14), transparent 72%),
          radial-gradient(closest-side at 70% 55%, rgba(255,255,255,0.10), transparent 74%);
        filter: blur(10px);
        animation: fogDrift 16s ease-in-out infinite;
      }
      .scene-fog-2 {
        background-image:
          radial-gradient(closest-side at 45% 75%, rgba(255,255,255,0.10), transparent 78%),
          radial-gradient(closest-side at 80% 70%, rgba(255,255,255,0.08), transparent 80%);
        filter: blur(14px);
        animation: fogDrift2 22s ease-in-out infinite;
      }
      @keyframes fogDrift {
        0% { transform: translate3d(-3%, 0, 0); }
        50% { transform: translate3d(3%, -1%, 0); }
        100% { transform: translate3d(-3%, 0, 0); }
      }
      @keyframes fogDrift2 {
        0% { transform: translate3d(2%, 0, 0); }
        50% { transform: translate3d(-2%, 1%, 0); }
        100% { transform: translate3d(2%, 0, 0); }
      }

      /* Lightning flashes */
      .scene-lightning {
        background: rgba(255,255,255,0);
        animation: lightning 7s infinite;
        mix-blend-mode: screen;
      }
      @keyframes lightning {
        0%, 70%, 100% { background: rgba(255,255,255,0); }
        72% { background: rgba(255,255,255,0.10); }
        72.6% { background: rgba(255,255,255,0.00); }
        74% { background: rgba(255,255,255,0.16); }
        74.4% { background: rgba(255,255,255,0.00); }
      }

      /* Floating glows */
      .scene-float-slow { animation: floaty 7s ease-in-out infinite; }
      .scene-float-slower { animation: floaty 10s ease-in-out infinite; }
      @keyframes floaty {
        0%, 100% { transform: translate3d(0,0,0); }
        50% { transform: translate3d(0, 12px, 0); }
      }
    `}</style>
  );
}
