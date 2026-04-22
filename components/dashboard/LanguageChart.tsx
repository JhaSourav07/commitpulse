'use client';

import { motion } from 'framer-motion';
import { LanguageData } from '@/types/dashboard';

export default function LanguageChart({ languages }: { languages: LanguageData[] }) {
  // Calculate conic gradient string
  const gradientStops = languages.reduce<{ stops: string[], current: number }>(
    (acc, lang) => {
      const next = acc.current + lang.percentage;
      acc.stops.push(`${lang.color} ${acc.current}% ${next}%`);
      return { stops: acc.stops, current: next };
    },
    { stops: [], current: 0 }
  ).stops.join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] flex flex-col items-center justify-between min-h-[300px]"
    >
      <h3 className="text-lg font-bold text-white w-full text-left mb-6">Top Languages</h3>
      
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Outer Donut Ring with conic gradient */}
        <motion.div 
          initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 1, type: "spring" }}
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${gradientStops})`,
            maskImage: 'radial-gradient(transparent 55%, black 56%)',
            WebkitMaskImage: 'radial-gradient(transparent 55%, black 56%)',
          }}
        />
        
        {/* Glow behind center */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-[20px]" />
        
        {/* Center label */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-2xl font-bold text-white">{languages[0].percentage}%</span>
          <span className="text-[10px] text-white/50 uppercase">{languages[0].name}</span>
        </div>
      </div>

      <div className="w-full mt-8 flex flex-col gap-3">
        {languages.map((lang) => (
          <div key={lang.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" 
                style={{ backgroundColor: lang.color, color: lang.color }}
              />
              <span className="text-white/80">{lang.name}</span>
            </div>
            <span className="font-mono text-white/60">{lang.percentage}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
