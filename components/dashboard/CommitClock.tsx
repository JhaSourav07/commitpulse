'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import VisualizationTooltip from './VisualizationTooltip';
import { getContributionLabel } from './tooltipUtils';
import { CommitClockData } from '@/types/dashboard';
import { useTranslation } from '@/context/TranslationContext';

export function findPeakIndex(data: CommitClockData[]): number {
  if (data.length === 0) return 0;

  return data.reduce((peak, d, i) => (d.commits > data[peak].commits ? i : peak), 0);
}

export default function CommitClock({ data }: { data: CommitClockData[] }) {
  const { t } = useTranslation();
  const displayData = data.slice(0, 7);
  const maxCommits = Math.max(...displayData.map((d) => d.commits), 1);
  const radius = 80;
  const cx = 140;
  const cy = 140;
  const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
  const maxSpokeLength = 42;

  const [tooltip, setTooltip] = useState<{
    day: string;
    commits: number;
    insight: string;
    x: number;
    y: number;
  } | null>(null);

  const peakIndex = findPeakIndex(displayData);

  const hasData = displayData.length > 0 && displayData.some((d) => d.commits > 0);

  const showTooltip = (
    e: React.SyntheticEvent<SVGGElement>,
    day: string,
    commits: number,
    isPeak: boolean
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();

    setTooltip({
      day,
      commits,
      insight:
        commits === 0
          ? t('dashboard.clock.tooltip_no_commits')
          : isPeak
            ? t('dashboard.clock.tooltip_peak')
            : t('dashboard.clock.tooltip_activity'),
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/8 shadow-sm flex flex-col items-center min-h-[300px]"
      >
        <div className="w-full mb-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            {t('dashboard.clock.title')}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
            {t('dashboard.clock.active_days')}
          </p>
        </div>

        <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center mt-4">
          {hasData ? (
            <svg
              width="280"
              height="280"
              viewBox="0 0 280 280"
              className="w-full h-full overflow-visible rotate-[-90deg]"
            >
              <defs>
                <filter id="spoke-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <style>
                {`
                  :root {
                    --peak-spoke: #111111;
                    --peak-dot: rgba(17,17,17,0.7);
                    --peak-label: #111111;
                  }

                  .dark {
                    --peak-spoke: #ffffff;
                    --peak-dot: rgba(255,255,255,0.8);
                    --peak-label: #ffffff;
                  }
                `}
              </style>

              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="rgba(120,120,120,0.15)"
                strokeWidth="18"
              />

              <circle
                cx={cx}
                cy={cy}
                r={radius + maxSpokeLength + 8}
                fill="none"
                stroke="rgba(120,120,120,0.22)"
                strokeWidth="1"
              />

              {Array.from({ length: 35 }).map((_, i) => {
                const angle = (i * 360) / 35;
                const rad = (angle * Math.PI) / 180;
                const isMain = i % 5 === 0;

                const tickLength = isMain ? maxSpokeLength : 4;
                const innerOffset = isMain ? 0 : 4;

                return (
                  <line
                    key={`bg-tick-${i}`}
                    x1={r4(cx + (radius + innerOffset) * Math.cos(rad))}
                    y1={r4(cy + (radius + innerOffset) * Math.sin(rad))}
                    x2={r4(cx + (radius + tickLength) * Math.cos(rad))}
                    y2={r4(cy + (radius + tickLength) * Math.sin(rad))}
                    stroke={isMain ? 'rgba(120,120,120,0.28)' : 'rgba(120,120,120,0.14)'}
                    strokeWidth={isMain ? '4' : '2'}
                    strokeLinecap="round"
                  />
                );
              })}

              {displayData.map((d, i) => {
                const angle = (i * 360) / 7;
                const length = Math.max((d.commits / maxCommits) * maxSpokeLength, 4);
                const isHigh = d.commits > maxCommits * 0.7;
                const isPeak = i === peakIndex && d.commits > 0;
                const rad = (angle * Math.PI) / 180;

                const strokeW = isPeak ? 6 : isHigh ? 5 : 4;

                const x1 = r4(cx + radius * Math.cos(rad));
                const y1 = r4(cy + radius * Math.sin(rad));
                const x2 = r4(cx + (radius + length) * Math.cos(rad));
                const y2 = r4(cy + (radius + length) * Math.sin(rad));
                const labelX = r4(cx + (radius + maxSpokeLength + 14) * Math.cos(rad));
                const labelY = r4(cy + (radius + maxSpokeLength + 14) * Math.sin(rad));

                const spokeColor = isPeak
                  ? 'var(--peak-spoke)'
                  : isHigh
                    ? 'rgba(160,160,160,0.85)'
                    : 'rgba(110,110,110,0.55)';

                const dotColor = isPeak
                  ? 'var(--peak-dot)'
                  : isHigh
                    ? 'rgba(180,180,180,0.75)'
                    : 'rgba(120,120,120,0.55)';

                const labelColor = isPeak
                  ? 'var(--peak-label)'
                  : isHigh
                    ? 'rgba(180,180,180,0.75)'
                    : 'rgba(120,120,120,0.6)';

                return (
                  <motion.g
                    tabIndex={0}
                    role="img"
                    aria-label={`${d.day}: ${getContributionLabel(d.commits, t)}`}
                    onMouseEnter={(e) => showTooltip(e, d.day, d.commits, isPeak)}
                    onMouseMove={(e) => showTooltip(e, d.day, d.commits, isPeak)}
                    onMouseLeave={hideTooltip}
                    onFocus={(e) => showTooltip(e, d.day, d.commits, isPeak)}
                    onBlur={hideTooltip}
                    className="cursor-pointer outline-none"
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
                      stroke={spokeColor}
                      strokeWidth={strokeW}
                      strokeLinecap="round"
                      filter={isPeak ? 'url(#spoke-glow)' : undefined}
                    />

                    {d.commits > 0 && (
                      <circle
                        cx={x2}
                        cy={y2}
                        r={isPeak ? 2.2 : 2}
                        fill={dotColor}
                        filter={isPeak ? 'url(#spoke-glow)' : undefined}
                      />
                    )}

                    <text
                      x={labelX}
                      y={labelY}
                      fill={isPeak ? 'var(--peak-label)' : 'rgba(120,120,120,0.55)'}
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
                        fill={isPeak ? 'var(--peak-label)' : labelColor}
                        fontSize="7"
                        fontWeight="700"
                      >
                        {d.commits}
                      </tspan>
                    </text>
                  </motion.g>
                );
              })}
            </svg>
          ) : (
            <div className="h-[280px] flex items-center justify-center w-full rounded-lg border border-dashed border-black/10 dark:border-[rgba(255,255,255,0.08)] text-sm text-[#A1A1AA]">
              {t('dashboard.heatmap.empty')}
            </div>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[8px] text-gray-400 dark:text-white/60 mt-0.5">CYCLE</span>
            <span className="text-lg font-semibold text-gray-700 dark:text-white/65">7d</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {tooltip && (
          <VisualizationTooltip title={`${tooltip.day} activity`} x={tooltip.x} y={tooltip.y}>
            <div>{getContributionLabel(tooltip.commits, t)}</div>
            <div>{tooltip.insight}</div>
          </VisualizationTooltip>
        )}
      </AnimatePresence>
    </>
  );
}
