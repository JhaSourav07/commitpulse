'use client';

import { motion } from 'framer-motion';
import { LanguageData } from '@/types/dashboard';

export default function LanguageChart({ languages }: { languages: LanguageData[] }) {
  const gradientStops = languages
    .reduce<{ stops: string[]; current: number }>(
      (acc, lang) => {
        const next = acc.current + lang.percentage;
        acc.stops.push(`${lang.color} ${acc.current}% ${next}%`);
        return { stops: acc.stops, current: next };
      },
      { stops: [], current: 0 }
    )
    .stops.join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] flex flex-col items-center justify-between min-h-[300px]"
    >
      <h3 className="text-sm font-semibold text-white w-full text-left mb-6 tracking-tight">Top Languages</h3>

      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Donut */}
        <motion.div
          initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 80 }}
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${gradientStops})`,
            maskImage: 'radial-gradient(transparent 56%, black 57%)',
            WebkitMaskImage: 'radial-gradient(transparent 56%, black 57%)',
          }}
        />
        {/* Center */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-xl font-semibold text-white">{languages[0].percentage}%</span>
          <span className="text-[10px] text-[#A1A1AA] uppercase tracking-widest mt-0.5">{languages[0].name}</span>
        </div>
      </div>

      <div className="w-full mt-8 flex flex-col gap-2.5">
        {languages.map((lang) => (
          <div key={lang.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: lang.color }}
              />
              <span className="text-[#A1A1AA]">{lang.name}</span>
            </div>
            <span className="font-mono text-white/60 text-[11px]">{lang.percentage}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
