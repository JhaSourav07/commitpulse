'use client';

import { motion } from 'framer-motion';
import { CommitClockData } from '@/types/dashboard';

export default function CommitClock({ data }: { data: CommitClockData[] }) {
  const maxCommits = Math.max(...data.map(d => d.commits), 1);
  const radius = 80;
  const cx = 150;
  const cy = 150;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] flex flex-col items-center min-h-[300px] relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />

      <h3 className="text-lg font-bold text-white w-full text-left mb-2 z-10">Commit Clock</h3>
      <p className="text-xs text-white/50 w-full text-left mb-6 z-10">Your 24-hour activity cycle</p>

      <div className="relative w-[300px] h-[300px] flex items-center justify-center z-10">
        <svg width="300" height="300" className="rotate-[-90deg]">
          {/* Base circle */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="20" />
          
          {/* Data bars */}
          {data.map((d, i) => {
            const angle = (i * 360) / 24;
            const length = Math.max((d.commits / maxCommits) * 40, 5); // 5 to 40px length
            const isHigh = d.commits > maxCommits * 0.7;

            return (
              <motion.g 
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group"
              >
                <line 
                  x1={cx + radius * Math.cos((angle * Math.PI) / 180)}
                  y1={cy + radius * Math.sin((angle * Math.PI) / 180)}
                  x2={cx + (radius + length) * Math.cos((angle * Math.PI) / 180)}
                  y2={cy + (radius + length) * Math.sin((angle * Math.PI) / 180)}
                  stroke={isHigh ? "#a855f7" : "#06b6d4"} // Purple for high, cyan for normal
                  strokeWidth="6"
                  strokeLinecap="round"
                  className={`transition-all duration-300 ${isHigh ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'opacity-60 group-hover:opacity-100'}`}
                />
              </motion.g>
            );
          })}

          {/* Time markers (3, 6, 9, 12) */}
          <text x={cx + radius - 15} y={cy + 4} fill="rgba(255,255,255,0.4)" fontSize="10" transform={`rotate(90, ${cx + radius - 15}, ${cy + 4})`}>6h</text>
          <text x={cx} y={cy + radius - 10} fill="rgba(255,255,255,0.4)" fontSize="10" transform={`rotate(90, ${cx}, ${cy + radius - 10})`}>12h</text>
          <text x={cx - radius + 15} y={cy + 4} fill="rgba(255,255,255,0.4)" fontSize="10" transform={`rotate(90, ${cx - radius + 15}, ${cy + 4})`}>18h</text>
          <text x={cx} y={cy - radius + 15} fill="rgba(255,255,255,0.4)" fontSize="10" transform={`rotate(90, ${cx}, ${cy - radius + 15})`}>24h</text>
        </svg>

        {/* Center icon or text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="block text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-500">24h</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
