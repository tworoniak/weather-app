import { motion } from 'framer-motion';

export default function WeatherScene({ condition }: { condition: string }) {
  // Placeholder: swap this for your animated backgrounds later
  // e.g. map condition + day/night -> gradient + particles
  return (
    <motion.div
      className='pointer-events-none fixed inset-0 -z-10'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      aria-hidden
    >
      <div className='absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950' />
      <div className='absolute inset-0 opacity-30 blur-3xl'>
        <div className='absolute left-[-20%] top-[-20%] h-[60vh] w-[60vh] rounded-full bg-white/10' />
        <div className='absolute right-[-20%] bottom-[-20%] h-[60vh] w-[60vh] rounded-full bg-white/10' />
      </div>
      <div className='absolute left-4 top-4 rounded-xl bg-black/30 px-3 py-2 text-xs text-white/70'>
        Scene: {condition}
      </div>
    </motion.div>
  );
}
