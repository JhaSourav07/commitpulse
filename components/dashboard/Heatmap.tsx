'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityData } from '@/types/dashboard';

const CELL = 14;
const GAP = 3;

interface TooltipState {
  text: string;
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

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return 'bg-[#1a1a1a]';
      case 1:
        return 'bg-zinc-800';
      case 2:
        return 'bg-zinc-600';
      case 3:
        return 'bg-zinc-400';
      case 4:
        return 'bg-white';
      default:
        return 'bg-[#1a1a1a]';
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, day: ActivityData) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      text: `${day.count} contribution${day.count !== 1 ? 's' : ''} on ${day.date}`,
      // Centre the tooltip above the cell
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
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
        className="p-6 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)]"
      >
        {/* Header */}
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Contribution Heatmap
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">Last 365 days</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div key={level} className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Scale wrapper */}
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
                  {week.map((day, dIndex) => (
                    <div
                      key={dIndex}
                      onMouseEnter={(e) => handleMouseEnter(e, day)}
                      onMouseLeave={handleMouseLeave}
                      className={`rounded-sm cursor-pointer transition-all duration-150 hover:brightness-125 hover:scale-125 ${getIntensityColor(day.intensity)}`}
                      style={{ width: CELL, height: CELL }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tooltip rendered at viewport level — unaffected by scale/overflow */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="heatmap-tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[9999] pointer-events-none -translate-x-1/2 -translate-y-full"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="bg-[#111] border border-[rgba(255,255,255,0.1)] px-2.5 py-1.5 rounded-md text-[11px] text-white shadow-lg whitespace-nowrap">
              {tooltip.text}
            </div>
            {/* Arrow */}
            <div className="mx-auto w-2 h-2 bg-black/90 border-r border-b border-white/10 rotate-45 -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
