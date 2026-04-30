'use client';

import { motion } from 'framer-motion';
import { CommitClockData } from '@/types/dashboard';

export default function CommitClock({ data }: { data: CommitClockData[] }) {
  const maxCommits = Math.max(...data.map((d) => d.commits), 1);
  const radius = 80;
  const cx = 150;
  const cy = 150;
  const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="p-6 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] flex flex-col items-center min-h-[300px]"
    >
      <div className="w-full mb-1">
        <h3 className="text-sm font-semibold text-white tracking-tight">Commit Clock</h3>
        <p className="text-xs text-[#A1A1AA] mt-1">24-hour activity cycle</p>
      </div>

      <div className="relative w-[280px] h-[280px] flex items-center justify-center mt-4">
        <svg width="280" height="280" className="rotate-[-90deg]">
          {/* Base ring */}
          <circle
            cx={cx - 10}
            cy={cy - 10}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="18"
          />

          {/* Spokes */}
          {data.map((d, i) => {
            const angle = (i * 360) / 24;
            const length = Math.max((d.commits / maxCommits) * 38, 4);
            const isHigh = d.commits > maxCommits * 0.7;
            const rad = (angle * Math.PI) / 180;

            return (
              <motion.g
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              >
                <line
                  x1={r4((cx - 10) + radius * Math.cos(rad))}
                  y1={r4((cy - 10) + radius * Math.sin(rad))}
                  x2={r4((cx - 10) + (radius + length) * Math.cos(rad))}
                  y2={r4((cy - 10) + (radius + length) * Math.sin(rad))}
                  stroke={isHigh ? '#ffffff' : 'rgba(255,255,255,0.2)'}
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </motion.g>
            );
          })}

          {/* Hour labels */}
          {(['6h', '12h', '18h', '24h'] as const).map((label, i) => {
            const positions = [
              { x: (cx - 10) + radius - 14, y: (cy - 10) + 4 },
              { x: (cx - 10),               y: (cy - 10) + radius - 8 },
              { x: (cx - 10) - radius + 14, y: (cy - 10) + 4 },
              { x: (cx - 10),               y: (cy - 10) - radius + 14 },
            ];
            const p = positions[i];
            return (
              <text
                key={label}
                x={p.x}
                y={p.y}
                fill="rgba(255,255,255,0.25)"
                fontSize="9"
                textAnchor="middle"
                transform={`rotate(90, ${p.x}, ${p.y})`}
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xl font-semibold text-white/60">24h</span>
        </div>
      </div>
    </motion.div>
  );
}
