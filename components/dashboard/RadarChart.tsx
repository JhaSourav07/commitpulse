'use client';

import { motion } from 'framer-motion';
import type { LanguageData } from '@/types/dashboard';

interface RadarChartProps {
  languagesA: LanguageData[];
  languagesB: LanguageData[];
  labelA: string;
  labelB: string;
}

export default function RadarChart({ languagesA, languagesB, labelA, labelB }: RadarChartProps) {
  // Combine top languages from both developers
  const combinedLanguages = Array.from(
    new Set([...languagesA.map((l) => l.name), ...languagesB.map((l) => l.name)])
  ).slice(0, 6); // Cap at 6 languages for clean layout

  const hasLanguages = combinedLanguages.length > 0;
  const N = combinedLanguages.length;
  const cx = 160;
  const cy = 160;
  const r = 90; // max radius

  // Calculate coordinates for a given index and percentage (0-100)
  const getCoordinates = (index: number, percentage: number) => {
    const angle = (index * 2 * Math.PI) / N - Math.PI / 2;
    const distance = (Math.max(0, Math.min(100, percentage)) / 100) * r;
    const x = cx + distance * Math.cos(angle);
    const y = cy + distance * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate background polygon paths (concentric grids)
  const levels = [25, 50, 75, 100];
  const gridPolygons = levels.map((level) => {
    const points = Array.from({ length: N })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, level);
        return `${x},${y}`;
      })
      .join(' ');
    return points;
  });

  // Calculate user data points
  const pointsDataA = combinedLanguages.map((lang, i) => {
    const pct = languagesA.find((l) => l.name === lang)?.percentage || 0;
    return { pct, ...getCoordinates(i, pct) };
  });

  const pointsDataB = combinedLanguages.map((lang, i) => {
    const pct = languagesB.find((l) => l.name === lang)?.percentage || 0;
    return { pct, ...getCoordinates(i, pct) };
  });

  const pointsStrA = pointsDataA.map((p) => `${p.x},${p.y}`).join(' ');
  const pointsStrB = pointsDataB.map((p) => `${p.x},${p.y}`).join(' ');

  // Center/initial zero points for entry animation
  const zeroPointsStr = Array.from({ length: N })
    .map(() => `${cx},${cy}`)
    .join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col items-center justify-between min-h-[360px]"
    >
      <div className="w-full mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
            Language Dominance
          </h3>
          <p className="text-[10px] text-[#A1A1AA] uppercase tracking-widest mt-0.5">
            Radar Comparison
          </p>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-[10px] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-500/20 border border-cyan-500" />
            <span className="text-gray-900 dark:text-white/80 truncate max-w-[80px]">{labelA}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-500/20 border border-purple-500" />
            <span className="text-gray-900 dark:text-white/80 truncate max-w-[80px]">{labelB}</span>
          </div>
        </div>
      </div>

      {hasLanguages ? (
        <>
          <div className="relative w-[320px] h-[300px] flex items-center justify-center">
            <svg width="320" height="300" className="overflow-visible">
              <defs>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Polygons */}
              {gridPolygons.map((points, idx) => (
                <polygon
                  key={`grid-${idx}`}
                  points={points}
                  fill="none"
                  stroke="rgba(120, 120, 120, 0.12)"
                  strokeWidth="1"
                />
              ))}

              {/* Axis lines and labels */}
              {combinedLanguages.map((lang, i) => {
                const outerCoord = getCoordinates(i, 100);
                const labelDist = r + 18;
                const angle = outerCoord.angle;
                const labelX = cx + labelDist * Math.cos(angle);
                const labelY = cy + labelDist * Math.sin(angle);

                // Determine text alignment based on angle to avoid chart overlap
                const cos = Math.cos(angle);
                const textAnchor = Math.abs(cos) < 0.1 ? 'middle' : cos > 0 ? 'start' : 'end';

                return (
                  <g key={`axis-${i}`}>
                    {/* Axis line */}
                    <line
                      x1={cx}
                      y1={cy}
                      x2={outerCoord.x}
                      y2={outerCoord.y}
                      stroke="rgba(120, 120, 120, 0.16)"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />

                    {/* Axis label text */}
                    <text
                      x={labelX}
                      y={labelY + 4}
                      fill="rgba(161, 161, 170, 0.9)"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor={textAnchor}
                      className="font-sans tracking-wide"
                    >
                      {lang}
                    </text>
                  </g>
                );
              })}

              {/* User A Area Polygon */}
              <motion.polygon
                initial={{ points: zeroPointsStr }}
                animate={{ points: pointsStrA }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                fill="rgba(6, 182, 212, 0.08)"
                stroke="#06b6d4"
                strokeWidth="1.8"
                filter="url(#glow-cyan)"
              />

              {/* User B Area Polygon */}
              <motion.polygon
                initial={{ points: zeroPointsStr }}
                animate={{ points: pointsStrB }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                fill="rgba(168, 85, 247, 0.08)"
                stroke="#a855f7"
                strokeWidth="1.8"
                filter="url(#glow-purple)"
              />

              {/* Dots on Vertices (User A) */}
              {pointsDataA.map(
                (p, i) =>
                  p.pct > 0 && (
                    <circle
                      key={`dot-a-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r="3"
                      fill="#06b6d4"
                      className="drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]"
                    />
                  )
              )}

              {/* Dots on Vertices (User B) */}
              {pointsDataB.map(
                (p, i) =>
                  p.pct > 0 && (
                    <circle
                      key={`dot-b-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r="3"
                      fill="#a855f7"
                      className="drop-shadow-[0_0_4px_rgba(168,85,247,0.6)]"
                    />
                  )
              )}
            </svg>
          </div>

          {/* Language percentages side-by-side overview */}
          <div className="w-full mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-black/5 dark:border-white/5 pt-4 text-[10px]">
            {combinedLanguages.slice(0, 4).map((lang) => {
              const pctA = languagesA.find((l) => l.name === lang)?.percentage || 0;
              const pctB = languagesB.find((l) => l.name === lang)?.percentage || 0;

              return (
                <div key={lang} className="flex justify-between items-center py-0.5">
                  <span className="text-[#A1A1AA] truncate font-medium max-w-[70px]">{lang}</span>
                  <div className="flex gap-3 font-mono font-bold">
                    <span className="text-cyan-500">{pctA}%</span>
                    <span className="text-zinc-600 dark:text-zinc-500">|</span>
                    <span className="text-purple-500">{pctB}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center py-12 text-center">
          <p className="text-xs font-medium text-[#A1A1AA]">No language data to compare yet</p>
        </div>
      )}
    </motion.div>
  );
}
