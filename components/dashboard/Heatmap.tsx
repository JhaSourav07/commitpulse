'use client';

import { motion } from 'framer-motion';
import { ActivityData } from '@/types/dashboard';

export default function Heatmap({ data }: { data: ActivityData[] }) {
  // Group data by weeks for GitHub style grid
  // In a real app, this would require aligning dates to start on Sunday/Monday
  // Here we just chunk it into 7-day columns
  const weeks = [];
  const chunkSize = 7;
  for (let i = 0; i < data.length; i += chunkSize) {
    weeks.push(data.slice(i, i + chunkSize));
  }

  // Define colors based on intensity (0 to 4)
  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return 'bg-white/5'; // no activity
      case 1:
        return 'bg-cyan-900/50';
      case 2:
        return 'bg-cyan-700/80 text-cyan-200';
      case 3:
        return 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]';
      case 4:
        return 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]';
      default:
        return 'bg-white/5';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-x-auto"
    >
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Contribution Heatmap</h3>
          <p className="text-xs text-white/50">Last 365 days</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-1 min-w-max pb-2">
        {weeks.map((week, wIndex) => (
          <div key={wIndex} className="flex flex-col gap-1">
            {week.map((day, dIndex) => (
              <div
                key={dIndex}
                className={`w-3 h-3 md:w-4 md:h-4 rounded-sm transition-all duration-300 hover:scale-125 cursor-pointer hover:z-10 group relative ${getIntensityColor(day.intensity)}`}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 border border-white/10 px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-xl">
                  {day.count} contributions on {day.date}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
