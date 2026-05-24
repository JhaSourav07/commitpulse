'use client';

import { motion } from 'framer-motion';
import { CommitClockData } from '@/types/dashboard';

export default function CommitClock({ data }: { data: CommitClockData[] }) {
  const maxCommits = Math.max(...data.map((d) => d.commits), 1);
  const radius = 80;
  const cx = 140;
  const cy = 140;
  const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
  const maxSpokeLength = 42;

  // Find the peak day index
  const peakIndex = data.reduce((peak, d, i) => (d.commits > data[peak].commits ? i : peak), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/8 shadow-sm flex flex-col items-center min-h-[300px]"
    >
      <div className="w-full mb-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
          Commit Clock
        </h3>
        <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">Weekly activity cycle</p>
      </div>

      <div className="relative w-[280px] h-[280px] flex items-center justify-center mt-4">
        <svg width="280" height="280" className="overflow-visible rotate-[-90deg]">
          <defs>
            <filter id="spoke-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Base ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-black/5 dark:text-white/4"
            strokeWidth="18"
          />

          {/* Outer boundary ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius + maxSpokeLength + 8}
            fill="none"
            stroke="currentColor"
            className="text-black/10 dark:text-white/8"
            strokeWidth="1"
          />

          {/* Subtle background dial (35 ticks = 7 days * 5 sub-intervals) */}
          {Array.from({ length: 35 }).map((_, i) => {
            const angle = (i * 360) / 35;
            const rad = (angle * Math.PI) / 180;
            const isMain = i % 5 === 0;

            // Main spokes get a full-length faint track, interval ticks are short
            const tickLength = isMain ? maxSpokeLength : 4;
            const innerOffset = isMain ? 0 : 4;

            return (
              <line
                key={`bg-tick-${i}`}
                x1={r4(cx + (radius + innerOffset) * Math.cos(rad))}
                y1={r4(cy + (radius + innerOffset) * Math.sin(rad))}
                x2={r4(cx + (radius + tickLength) * Math.cos(rad))}
                y2={r4(cy + (radius + tickLength) * Math.sin(rad))}
                stroke="currentColor"
                className={
                  isMain ? 'text-black/15 dark:text-white/12' : 'text-black/5 dark:text-white/6'
                }
                strokeWidth={isMain ? '4' : '2'}
                strokeLinecap="round"
              />
            );
          })}

          {/* Spokes — one per day of week */}
          {data.map((d, i) => {
            const angle = (i * 360) / 7;
            const length = Math.max((d.commits / maxCommits) * maxSpokeLength, 4);
            const isHigh = d.commits > maxCommits * 0.7;
            const isPeak = i === peakIndex && d.commits > 0;
            const rad = (angle * Math.PI) / 180;

            // Scale stroke width: 3px base, up to 6px for peak
            const strokeW = isPeak ? 6 : isHigh ? 5 : 4;

            const x1 = r4(cx + radius * Math.cos(rad));
            const y1 = r4(cy + radius * Math.sin(rad));
            const x2 = r4(cx + (radius + length) * Math.cos(rad));
            const y2 = r4(cy + (radius + length) * Math.sin(rad));
            const labelX = r4(cx + (radius + maxSpokeLength + 14) * Math.cos(rad));
            const labelY = r4(cy + (radius + maxSpokeLength + 14) * Math.sin(rad));

            return (
              <motion.g
                key={d.day}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  className={
                    isPeak
                      ? 'text-zinc-900 dark:text-white'
                      : isHigh
                        ? 'text-zinc-800/70 dark:text-white/80'
                        : 'text-zinc-800/25 dark:text-white/30'
                  }
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  filter={isPeak ? 'url(#spoke-glow)' : undefined}
                />

                {/* Dot at the end of each spoke */}
                {d.commits > 0 && (
                  <circle
                    cx={x2}
                    cy={y2}
                    r={isPeak ? 3 : 2}
                    fill="currentColor"
                    className={
                      isPeak
                        ? 'text-zinc-900 dark:text-white'
                        : isHigh
                          ? 'text-zinc-900 dark:text-white'
                          : 'text-zinc-800/40 dark:text-white/50'
                    }
                    filter={isPeak ? 'url(#spoke-glow)' : undefined}
                  />
                )}

                {/* Day and Commit Count Label (stacked vertically via tspan to avoid side overlaps) */}
                <text
                  x={labelX}
                  y={labelY}
                  fill="currentColor"
                  className={
                    isPeak
                      ? 'text-zinc-900 dark:text-white'
                      : isHigh
                        ? 'text-zinc-800/70 dark:text-white/70'
                        : 'text-zinc-800/35 dark:text-white/35'
                  }
                  fontSize="9"
                  fontWeight={isPeak ? '700' : '400'}
                  textAnchor="middle"
                  transform={`rotate(90, ${labelX}, ${labelY})`}
                >
                  <tspan x={labelX} dy="-2">
                    {d.day}
                  </tspan>
                  <tspan
                    x={labelX}
                    dy="10"
                    fill="currentColor"
                    className={
                      isPeak
                        ? 'text-zinc-900 dark:text-white'
                        : 'text-zinc-800/30 dark:text-white/30'
                    }
                    fontSize="7"
                    fontWeight="400"
                  >
                    {d.commits}
                  </tspan>
                </text>
              </motion.g>
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-semibold text-zinc-500 dark:text-white/60">7d</span>
          <span className="text-[8px] text-zinc-400 dark:text-white/20 mt-0.5">CYCLE</span>
        </div>
      </div>
    </motion.div>
  );
}
