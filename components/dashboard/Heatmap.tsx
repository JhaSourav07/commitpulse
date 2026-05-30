'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ActivityData } from '@/types/dashboard';
import { getIntensityColor } from './heatmapUtils';
import VisualizationTooltip from './VisualizationTooltip';
import {
  formatTooltipDate,
  getActivityInsight,
  getContributionLabel,
  getLocalActiveStreak,
  getStreakLabel,
} from './tooltipUtils';

const CELL = 14;
const GAP = 3;

interface TooltipState {
  count: number;
  date: string;
  insight: string;
  streak: string;
  x: number;
  y: number;
}

export default function Heatmap({ data }: { data: ActivityData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Group into 7-day columns
  const weeks: ActivityData[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const naturalWidth = weeks.length * (CELL + GAP) - GAP;
  const hasData = data.length > 0 && data.some((d) => d.count > 0);

  // Recalculate scale whenever the card resizes
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width;
      if (available > 0) setScale(Math.min(1, available / naturalWidth));
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [naturalWidth]);

  const handleMouseEnter = (
    e: SyntheticEvent<HTMLDivElement>,
    day: ActivityData,
    index: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const streak = getLocalActiveStreak(data, index);

    setTooltip({
      count: day.count,
      date: formatTooltipDate(day.date),
      insight: getActivityInsight(day.count, day.intensity),
      streak: getStreakLabel(streak),
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border border-black/10 bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#0a0a0a]"
      >
        {/* Header */}
        <h3 className="my-1 text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
          Contribution Heatmap
        </h3>

        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="mt-0.5 text-xs text-[#A1A1AA]">Last 365 days</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-2 w-2 rounded-sm xs:h-3 xs:w-3 ${getIntensityColor(level)}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Scale wrapper */}
        {hasData ? (
          <div ref={containerRef} className="w-full overflow-hidden">
            <div
              style={{
                width: naturalWidth,
                transformOrigin: 'top left',
                transform: `scale(${scale})`,
                height: (7 * (CELL + GAP) - GAP) * scale,
              }}
            >
              <div className="flex" style={{ gap: GAP }}>
                {weeks.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col" style={{ gap: GAP }}>
                    {week.map((day, dIndex) => {
                      const originalIndex = wIndex * 7 + dIndex;

                      return (
                        <div
                          key={day.date}
                          aria-label={`${getContributionLabel(
                            day.count
                          )} on ${formatTooltipDate(day.date)}`}
                          tabIndex={0}
                          onMouseEnter={(e) => handleMouseEnter(e, day, originalIndex)}
                          onFocus={(e) => handleMouseEnter(e, day, originalIndex)}
                          onMouseLeave={handleMouseLeave}
                          onBlur={handleMouseLeave}
                          className={`cursor-pointer rounded-sm transition-all duration-150 hover:scale-125 hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-white/70 dark:focus:ring-white ${getIntensityColor(
                            day.intensity
                          )}`}
                          style={{ width: CELL, height: CELL }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-black/10 text-sm text-[#A1A1AA] dark:border-[rgba(255,255,255,0.08)]">
            No recent activity to display
          </div>
        )}
      </motion.div>

      {/* Tooltip rendered at viewport level — unaffected by scale/overflow */}
      <AnimatePresence>
        {tooltip && (
          <VisualizationTooltip
            title={`${getContributionLabel(tooltip.count)} on ${tooltip.date}`}
            x={tooltip.x}
            y={tooltip.y}
          >
            <div>{tooltip.insight}</div>
            <div>{tooltip.streak}</div>
          </VisualizationTooltip>
        )}
      </AnimatePresence>
    </>
  );
}
