'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';

interface GrowthTrendChartProps {
  activityA: Array<{ date: string; count: number }>;
  activityB: Array<{ date: string; count: number }>;
  labelA: string;
  labelB: string;
}

export default function GrowthTrendChart({
  activityA,
  activityB,
  labelA,
  labelB,
}: GrowthTrendChartProps) {
  // Generate unique IDs to prevent SVG <defs> collisions when multiple instances render
  const instanceId = useId();

  // 1. Generate chronological list of the last 12 months
  const months: Array<{
    key: string;
    label: string;
    countA: number;
    countB: number;
  }> = [];

  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const monthNum = String(d.getMonth() + 1).padStart(2, '0');
    const label = d.toLocaleString('default', { month: 'short' });
    months.push({
      key: `${year}-${monthNum}`,
      label,
      countA: 0,
      countB: 0,
    });
  }

  // 2. Aggregate data by YYYY-MM
  activityA.forEach((day) => {
    const monthKey = day.date.substring(0, 7);
    const monthObj = months.find((m) => m.key === monthKey);
    if (monthObj) {
      monthObj.countA += day.count;
    }
  });

  activityB.forEach((day) => {
    const monthKey = day.date.substring(0, 7);
    const monthObj = months.find((m) => m.key === monthKey);
    if (monthObj) {
      monthObj.countB += day.count;
    }
  });

  // 3. Chart Coordinates
  const maxVal = Math.max(...months.map((m) => Math.max(m.countA, m.countB)), 1);
  const width = 500;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getCoordinates = (index: number, count: number) => {
    const x = paddingLeft + (index / 11) * chartW;
    const y = paddingTop + chartH - (count / maxVal) * chartH;
    return { x, y };
  };

  const pointsA = months.map((m, i) => getCoordinates(i, m.countA));
  const pointsB = months.map((m, i) => getCoordinates(i, m.countB));

  // Generate SVG path string
  const pathStrA = pointsA.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const pathStrB = pointsB.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Generate Area SVG path string (closed to bottom)
  const areaStrA =
    pointsA.length > 0
      ? `${pathStrA} L ${pointsA[pointsA.length - 1].x} ${paddingTop + chartH} L ${pointsA[0].x} ${paddingTop + chartH} Z`
      : '';
  const areaStrB =
    pointsB.length > 0
      ? `${pathStrB} L ${pointsB[pointsB.length - 1].x} ${paddingTop + chartH} L ${pointsB[0].x} ${paddingTop + chartH} Z`
      : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col justify-between"
    >
      <div className="w-full mb-6 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
            Contribution Growth Trend
          </h3>
          <p className="text-[10px] text-[#A1A1AA] uppercase tracking-widest mt-0.5">
            Monthly Momentum
          </p>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-[10px] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-500" />
            <span className="text-gray-900 dark:text-white/80">{labelA}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-purple-500" />
            <span className="text-gray-900 dark:text-white/80">{labelB}</span>
          </div>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div
        data-testid="growth-trend-chart-container"
        className="relative w-full h-[180px] overflow-hidden"
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`${instanceId}-gradient-area-a`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${instanceId}-gradient-area-b`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
            <filter id={`${instanceId}-glow-line-a`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id={`${instanceId}-glow-line-b`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + chartH * ratio;
            return (
              <line
                key={`grid-y-${idx}`}
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="rgba(120, 120, 120, 0.08)"
                strokeWidth="1"
              />
            );
          })}

          {/* Paths (Area) */}
          <motion.path
            d={areaStrA}
            fill={`url(#${instanceId}-gradient-area-a)`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
          <motion.path
            d={areaStrB}
            fill={`url(#${instanceId}-gradient-area-b)`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          />

          {/* Paths (Line Stroke) */}
          <motion.path
            d={pathStrA}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${instanceId}-glow-line-a)`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <motion.path
            d={pathStrB}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${instanceId}-glow-line-b)`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
          />

          {/* Monthly X Labels */}
          {months.map((m, i) => {
            const pos = getCoordinates(i, 0);
            // Render labels every 2 months to prevent overlap on small screens
            if (i % 2 !== 0 && i !== 11) return null;
            return (
              <text
                key={`lbl-x-${i}`}
                x={pos.x}
                y={height - 2}
                fill="rgba(120, 120, 120, 0.55)"
                fontSize="8"
                fontWeight="500"
                textAnchor="middle"
                className="font-sans"
              >
                {m.label}
              </text>
            );
          })}

          {/* Y Labels */}
          {[0, 0.5, 1].map((ratio) => {
            const count = Math.round(maxVal * (1 - ratio));
            const y = paddingTop + chartH * ratio;
            return (
              <text
                key={`lbl-y-${ratio}`}
                x={paddingLeft - 8}
                y={y + 3}
                fill="rgba(120, 120, 120, 0.55)"
                fontSize="8"
                fontWeight="500"
                textAnchor="end"
                className="font-mono"
              >
                {count}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Commit Battle Timeline */}
      <div className="w-full mt-6 border-t border-black/10 dark:border-white/5 pt-6">
        <h4 className="text-[10px] text-[#A1A1AA] uppercase tracking-widest font-semibold mb-4">
          ⚔️ Commit Battle Timeline
        </h4>
        <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-zinc-800">
          {months.map((month) => {
            const diff = Math.abs(month.countA - month.countB);
            const winner =
              month.countA > month.countB ? 'A' : month.countB > month.countA ? 'B' : 'Tie';

            return (
              <div
                key={month.key}
                className="flex-1 min-w-[56px] flex flex-col items-center p-2 rounded-lg bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-[rgba(255,255,255,0.04)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.08)] transition-all duration-200"
              >
                <span className="text-[10px] text-gray-500 dark:text-white/60 font-semibold">
                  {month.label}
                </span>

                {winner === 'A' && (
                  <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/10 px-1.5 py-0.5 rounded-full mt-2 truncate w-full text-center">
                    +{diff}
                  </span>
                )}
                {winner === 'B' && (
                  <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/10 px-1.5 py-0.5 rounded-full mt-2 truncate w-full text-center">
                    +{diff}
                  </span>
                )}
                {winner === 'Tie' && (
                  <span className="text-[9px] font-medium text-gray-500 bg-gray-500/10 px-1.5 py-0.5 rounded-full mt-2 truncate w-full text-center">
                    Tie
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
