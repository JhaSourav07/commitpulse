'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, FileImage, FileText, Code, Loader2 } from 'lucide-react';
import type { ActivityData } from '@/types/dashboard';
import { getIntensityColor } from './heatmapUtils';
import VisualizationTooltip from './VisualizationTooltip';
import { useTranslation } from '@/context/TranslationContext';
import { useExportImage } from '@/hooks/useExportImage';
import {
  formatTooltipDate,
  getActivityInsight,
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

interface HeatmapProps {
  data: ActivityData[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  timeZone?: string;
  username?: string;
}

export default function Heatmap({
  data,
  title,
  subtitle,
  emptyMessage,
  timeZone = 'UTC',
  username,
}: HeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { t } = useTranslation();

  const exportFilename = username ? `${username}-heatmap` : 'heatmap-activity';
  const { exportImage, isExporting } = useExportImage({
    targetSelector: '[data-export-target="heatmap-card"]',
    filename: exportFilename,
  });

  const effectiveTimeZone = timeZone || 'UTC';

  const getTimeZoneDateLabel = (input: string | Date) => {
    const date = typeof input === 'string' ? new Date(`${input}T00:00:00Z`) : input;

    return new Intl.DateTimeFormat('en-CA', {
      timeZone: effectiveTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  // 1. Filter out future dates by comparing the activity day against the current
  // timezone-specific calendar date.
  const todayInZone = getTimeZoneDateLabel(new Date());

  const validData = data.filter((day) => day.date <= todayInZone);

  // 2. Group into 7-day columns using validData instead of data
  const weeks: ActivityData[][] = [];
  for (let i = 0; i < validData.length; i += 7) {
    weeks.push(validData.slice(i, i + 7));
  }

  const naturalWidth = weeks.length * (CELL + GAP) - GAP;
  const hasData = validData.length > 0 && validData.some((d) => d.count > 0);

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

  const handleCellFocus = (e: SyntheticEvent<HTMLDivElement>, day: ActivityData, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const streak = getLocalActiveStreak(validData, index);
    const label = t(
      day.count === 1 ? 'dashboard.heatmap.tooltip_single' : 'dashboard.heatmap.tooltip_plural',
      { count: day.count.toString(), date: formatTooltipDate(day.date) }
    );

    setAnnouncement(label);
    setTooltip({
      count: day.count,
      date: formatTooltipDate(day.date),
      insight: getActivityInsight(day.count, day.intensity, t),
      streak: getStreakLabel(streak, t),
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseEnter = (
    e: SyntheticEvent<HTMLDivElement>,
    day: ActivityData,
    index: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const streak = getLocalActiveStreak(validData, index);

    setTooltip({
      count: day.count,
      date: formatTooltipDate(day.date),
      insight: getActivityInsight(day.count, day.intensity, t),
      streak: getStreakLabel(streak, t),
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  const handleBlur = () => {
    setTooltip(null);
    setAnnouncement('');
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    wIndex: number,
    dIndex: number
  ) => {
    let targetW = wIndex;
    let targetD = dIndex;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (dIndex > 0) {
          targetD = dIndex - 1;
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (dIndex < weeks[wIndex].length - 1) {
          targetD = dIndex + 1;
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (wIndex > 0) {
          targetW = wIndex - 1;
          targetD = Math.min(dIndex, weeks[targetW].length - 1);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (wIndex < weeks.length - 1) {
          targetW = wIndex + 1;
          targetD = Math.min(dIndex, weeks[targetW].length - 1);
        }
        break;
      default:
        return;
    }

    if (targetW !== wIndex || targetD !== dIndex) {
      const targetCell = containerRef.current?.querySelector<HTMLDivElement>(
        `[data-week="${targetW}"][data-day="${targetD}"]`
      );
      targetCell?.focus();
    }
  };

  const displayTitle = title || t('dashboard.heatmap.title');
  const displaySubtitle = subtitle || t('dashboard.heatmap.last_365');
  const displayEmptyMessage = emptyMessage || t('dashboard.heatmap.empty');

  return (
    <>
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-testid="heatmap-aria-live"
      >
        {announcement}
      </div>
      <motion.div
        data-testid="heatmap-card"
        data-export-target="heatmap-card"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border border-black/10 bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#0a0a0a]"
      >
        {/* Header */}
        <div className="flex items-center justify-between my-1">
          <h3
            data-testid="heatmap-heading"
            className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {displayTitle}
          </h3>

          <div className="relative inline-block">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              disabled={isExporting}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-label="Export heatmap"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all duration-150 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="animate-spin" size={12} />
              ) : (
                <Download size={12} className="text-emerald-500" />
              )}
              <span>Export</span>
            </button>

            {dropdownOpen && !isExporting && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setDropdownOpen(false)} />
                <ul
                  role="menu"
                  className="absolute right-0 z-30 mt-1 w-40 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#121212] shadow-xl overflow-hidden py-1 text-xs"
                >
                  <li role="none">
                    <button
                      role="menuitem"
                      onClick={async () => {
                        setDropdownOpen(false);
                        await exportImage('png');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <FileImage size={14} className="text-blue-500" />
                      <span>Download PNG</span>
                    </button>
                  </li>
                  <li role="none">
                    <button
                      role="menuitem"
                      onClick={async () => {
                        setDropdownOpen(false);
                        await exportImage('pdf');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <FileText size={14} className="text-red-500" />
                      <span>Download PDF</span>
                    </button>
                  </li>
                  <li role="none">
                    <button
                      role="menuitem"
                      onClick={async () => {
                        setDropdownOpen(false);
                        await exportImage('svg');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <Code size={14} className="text-emerald-500" />
                      <span>Download SVG</span>
                    </button>
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-end justify-between">
          <div>
            <p data-testid="heatmap-subtitle" className="mt-0.5 text-xs text-[#A1A1AA]">
              {displaySubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
            <span>{t('dashboard.heatmap.less')}</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-2 w-2 rounded-sm xs:h-3 xs:w-3 ${getIntensityColor(level)}`}
                />
              ))}
            </div>
            <span>{t('dashboard.heatmap.more')}</span>
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
              <div className="flex" role="grid" style={{ gap: GAP }}>
                {weeks.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col" role="row" style={{ gap: GAP }}>
                    {week.map((day, dIndex) => {
                      const originalIndex = wIndex * 7 + dIndex;
                      const cellLabel = t(
                        day.count === 1
                          ? 'dashboard.heatmap.tooltip_single'
                          : 'dashboard.heatmap.tooltip_plural',
                        { count: day.count.toString(), date: formatTooltipDate(day.date) }
                      );

                      return (
                        <div
                          key={day.date}
                          role="gridcell"
                          aria-label={cellLabel}
                          tabIndex={0}
                          data-week={wIndex}
                          data-day={dIndex}
                          onMouseEnter={(e) => handleMouseEnter(e, day, originalIndex)}
                          onFocus={(e) => handleCellFocus(e, day, originalIndex)}
                          onMouseLeave={handleMouseLeave}
                          onBlur={handleBlur}
                          onKeyDown={(e) => handleKeyDown(e, wIndex, dIndex)}
                          className={`cursor-pointer rounded-sm transition-all duration-150 hover:scale-125 hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:focus:ring-emerald-400 dark:focus:ring-offset-black ${getIntensityColor(
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
          <div
            data-testid="heatmap-empty-state"
            className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-black/10 text-sm text-[#A1A1AA] dark:border-[rgba(255,255,255,0.08)]"
          >
            {displayEmptyMessage}
          </div>
        )}
      </motion.div>
      {/* Tooltip rendered at viewport level — unaffected by scale/overflow */}
      <AnimatePresence>
        {tooltip && (
          <VisualizationTooltip
            title={t(
              tooltip.count === 1
                ? 'dashboard.heatmap.tooltip_single'
                : 'dashboard.heatmap.tooltip_plural',
              { count: tooltip.count.toString(), date: tooltip.date }
            )}
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
