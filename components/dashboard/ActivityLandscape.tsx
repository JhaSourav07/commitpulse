'use client';

import { useState, type SyntheticEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ActivityData } from '@/types/dashboard';
import VisualizationTooltip from './VisualizationTooltip';
import { formatTooltipDate, getActivityInsight, getContributionLabel } from './tooltipUtils';

const tabs = ['1W', '1M', '3M', '1Y'];

export const getFilteredData = (data: ActivityData[], activeTab: string): ActivityData[] => {
  let days = 90;
  if (activeTab === '1W') days = 7;
  if (activeTab === '1M') days = 30;
  if (activeTab === '1Y') days = 365;

  const recent = data.slice(-days);

  // Downsample to max 60 bars to keep the visualization clean
  if (recent.length > 60) {
    const step = Math.ceil(recent.length / 60);
    return recent.filter((_, i) => i % step === 0).slice(-60);
  }

  return recent;
};

interface TooltipState {
  title: string;
  metric: string;
  insight: string;
  x: number;
  y: number;
}

export default function ActivityLandscape({ data }: { data: ActivityData[] }) {
  const [activeTab, setActiveTab] = useState('3M');
  const [mode, setMode] = useState<'commits' | 'loc'>('commits');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const displayData = getFilteredData(data, activeTab);

  // Helper to extract the proper value based on the selected mode
  const getValue = (day: ActivityData) =>
    mode === 'loc' ? (day.locAdditions || 0) + (day.locDeletions || 0) : day.count;

  const maxCount = Math.max(...displayData.map(getValue), 1);

  const showTooltip = (e: SyntheticEvent<HTMLDivElement>, day: ActivityData, value: number) => {
    const rect = e.currentTarget.getBoundingClientRect();

    setTooltip({
      title: formatTooltipDate(day.date),
      metric: mode === 'loc' ? `${value} lines modified` : getContributionLabel(day.count),
      insight:
        mode === 'loc'
          ? value > 0
            ? 'Code activity recorded'
            : 'No code changes recorded'
          : getActivityInsight(day.count, day.intensity),
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-xl border border-black/10 bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#0a0a0a]"
      >
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-gray-900 dark:text-white">
              Activity Landscape
            </h2>
            <p className="mt-1 text-xs text-[#A1A1AA]">
              {mode === 'loc' ? 'Lines of code modified over time' : 'Commit frequency over time'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Toggle (Commits vs LoC) */}
            <div className="flex items-center rounded-lg border border-black/5 bg-gray-100 p-0.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111]">
              <button
                onClick={() => setMode('commits')}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  mode === 'commits'
                    ? 'border border-black/5 bg-white text-black shadow-sm dark:border-white/5 dark:bg-[#222] dark:text-white'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Commits
              </button>
              <button
                onClick={() => setMode('loc')}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  mode === 'loc'
                    ? 'border border-black/5 bg-white text-black shadow-sm dark:border-white/5 dark:bg-[#222] dark:text-white'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Lines of Code
              </button>
            </div>

            {/* Time Range Tabs */}
            <div className="flex overflow-hidden rounded-lg border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`cursor-pointer border-r border-black/10 px-3.5 py-1.5 text-xs font-medium transition-all duration-200 last:border-r-0 dark:border-[rgba(255,255,255,0.08)] ${
                    activeTab === tab
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black dark:bg-transparent dark:text-white/65 dark:hover:bg-[rgba(255,255,255,0.05)] dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Graph */}
        <div
          className="relative flex h-[200px] w-full items-end justify-between gap-0.5"
          role="img"
          aria-label="Activity chart showing contribution frequency over time"
        >
          {displayData.map((day, i) => {
            const val = getValue(day);
            const heightPercent = Math.max((val / maxCount) * 100, 3);

            // Recalculate intensity for LoC mode visually
            const isHigh = mode === 'loc' ? val > maxCount * 0.7 : day.intensity >= 3;
            const isMedium = mode === 'loc' ? val > 0 : day.intensity > 0;

            return (
              <div
                key={`${day.date}-${i}`}
                className="group/bar relative flex h-full flex-1 cursor-pointer items-end outline-none"
                aria-label={`${
                  mode === 'loc' ? `${val} lines modified` : getContributionLabel(day.count)
                } on ${formatTooltipDate(day.date)}`}
                tabIndex={0}
                onMouseEnter={(e) => showTooltip(e, day, val)}
                onFocus={(e) => showTooltip(e, day, val)}
                onMouseLeave={hideTooltip}
                onBlur={hideTooltip}
              >
                {/* Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.008,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`w-full rounded-t-[2px] transition-all duration-200 ${
                    isHigh
                      ? mode === 'loc'
                        ? 'bg-indigo-500 dark:bg-indigo-400'
                        : 'bg-black dark:bg-white'
                      : isMedium
                        ? mode === 'loc'
                          ? 'bg-indigo-300 hover:bg-indigo-400 dark:bg-indigo-500/50'
                          : 'bg-zinc-500 hover:bg-zinc-700 dark:bg-zinc-600 dark:hover:bg-zinc-400'
                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* X axis */}
        <div className="mt-3 h-px w-full bg-black/10 dark:bg-[rgba(255,255,255,0.06)]" />
      </motion.div>

      <AnimatePresence>
        {tooltip && (
          <VisualizationTooltip title={tooltip.title} x={tooltip.x} y={tooltip.y}>
            <div>{tooltip.metric}</div>
            <div>{tooltip.insight}</div>
          </VisualizationTooltip>
        )}
      </AnimatePresence>
    </>
  );
}
