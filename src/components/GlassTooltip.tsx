// import type { TooltipProps } from 'recharts';

// function GlassTooltip({
//   active,
//   payload,
//   label,
// }: TooltipProps<number, string>) {
//   if (!active || !payload || payload.length === 0) return null;

//   return (
//     <div className='rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs shadow-xl backdrop-blur-md'>
//       <div className='mb-1 font-semibold text-white/90'>{label}</div>

//       {payload.map((p) => (
//         <div key={p.dataKey as string} className='text-white/70'>
//           {p.name}: <span className='text-white/90'>{p.value}</span>
//         </div>
//       ))}
//     </div>
//   );
// }

// export default GlassTooltip;
