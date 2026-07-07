'use client';

import { useState, lazy, Suspense, type SyntheticEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ActivityData } from '@/types/dashboard';
import VisualizationTooltip from './VisualizationTooltip';
import {
  formatTooltipDate,
  formatTooltipRange,
  getActivityInsight,
  getContributionLabel,
} from './tooltipUtils';
import { useTranslation } from '@/context/TranslationContext';
import { use3DTheme } from '@/hooks/use3dtheme';

// Lazy-load the 3D city so it never increases the initial JS bundle
const ContributionCity3D = lazy(() => import('./ContributionCity3D'));

const tabs = ['1W', '1M', '3M', '1Y'];

// One bar: a single day, or an aggregated bucket that also records its window span (startDate, days).
export type ActivityBar = ActivityData & { startDate?: string; days?: number };

// Sum a window of days into one bar; count and loc are window sums and the bar records the bucket's span.
const aggregateBucket = (bucket: ActivityData[]): ActivityBar => {
  const last = bucket[bucket.length - 1];
  return {
    date: last.date,
    startDate: bucket[0].date,
    days: bucket.length,
    count: bucket.reduce((sum, d) => sum + d.count, 0),
    intensity: Math.max(...bucket.map((d) => d.intensity)) as ActivityData['intensity'],
    locAdditions: bucket.reduce((sum, d) => sum + (d.locAdditions || 0), 0),
    locDeletions: bucket.reduce((sum, d) => sum + (d.locDeletions || 0), 0),
  };
};

export const getFilteredData = (data: ActivityData[], activeTab: string): ActivityBar[] => {
  let days = 90;
  if (activeTab === '1W') days = 7;
  if (activeTab === '1M') days = 30;
  if (activeTab === '1Y') days = 365;

  const recent = data.slice(-days);

  // Aggregate into at most 60 bars, summing each window so no days are dropped.
  if (recent.length > 60) {
    const step = Math.ceil(recent.length / 60);
    const remainder = recent.length % step;
    const buckets: ActivityBar[] = [];

    // Keep the partial bucket at the oldest edge so the most recent bars stay full windows.
    if (remainder > 0) {
      buckets.push(aggregateBucket(recent.slice(0, remainder)));
    }
    for (let i = remainder; i < recent.length; i += step) {
      buckets.push(aggregateBucket(recent.slice(i, i + step)));
    }

    return buckets;
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
  const [is3D, setIs3D] = useState(false);
  const [timeLapseMode, setTimeLapseMode] = useState(false);
  const { t } = useTranslation();
  const theme3D = use3DTheme();

  const displayData = getFilteredData(data, activeTab);

  // Helper to extract the proper value based on the selected mode
  const getValue = (day: ActivityData) =>
    mode === 'loc' ? (day.locAdditions || 0) + (day.locDeletions || 0) : day.count;

  const maxCount = Math.max(...displayData.map(getValue), 1);

  const showTooltip = (
    e: SyntheticEvent<HTMLDivElement>,
    day: ActivityBar,
    value: number,
    heightPercent: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isRange = !!day.startDate && day.startDate !== day.date;
    const barHeight = (heightPercent / 100) * rect.height;

    setTooltip({
      title:
        day.startDate && day.startDate !== day.date
          ? formatTooltipRange(day.startDate, day.date)
          : formatTooltipDate(day.date),
      metric:
        mode === 'loc'
          ? t('dashboard.activity.lines_modified', {
              count: value.toString(),
              defaultValue: `${value} lines modified`,
            })
          : getContributionLabel(day.count, t),
      insight:
        mode === 'loc'
          ? value > 0
            ? t('dashboard.heatmap.code_activity', { defaultValue: 'Code activity recorded' })
            : t('dashboard.heatmap.no_code_changes', { defaultValue: 'No code changes recorded' })
          : isRange
            ? day.count === 0
              ? t('dashboard.activity.no_activity_range', {
                  defaultValue: 'No activity in this range',
                })
              : t('dashboard.activity.range_total', {
                  days: (day.days || 0).toString(),
                  defaultValue: `Total across ${day.days || 0} days`,
                })
            : getActivityInsight(day.count, day.intensity, t),
      x: rect.left + rect.width / 2,
      y: rect.bottom - barHeight - 10,
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
              {t('dashboard.activity.title')}
            </h2>
            <p className="mt-1 text-xs text-[#A1A1AA]">
              {mode === 'loc'
                ? t('dashboard.activity.loc_desc')
                : t('dashboard.activity.commits_desc')}
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
                {t('dashboard.activity.commits')}
              </button>
              <button
                onClick={() => setMode('loc')}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  mode === 'loc'
                    ? 'border border-black/5 bg-white text-black shadow-sm dark:border-white/5 dark:bg-[#222] dark:text-white'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {t('dashboard.activity.loc')}
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

            {/* ── 3D City View toggle ── */}
            <div className="group relative flex justify-center">
              <button
                onClick={() => {
                  if (is3D) setTimeLapseMode(false);
                  setIs3D((v) => !v);
                }}
                aria-pressed={is3D}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  is3D
                    ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-400 dark:border-indigo-400/30 dark:bg-indigo-500/10'
                    : 'border-black/10 bg-transparent text-gray-500 hover:border-black/20 hover:text-black dark:border-white/10 dark:hover:border-white/20 dark:hover:text-white'
                }`}
              >
                {/* Cube icon */}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M7 1.5 L12.5 4.5 V9.5 L7 12.5 L1.5 9.5 V4.5 Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <path
                    d="M7 1.5 V12.5 M1.5 4.5 L12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    strokeDasharray="2 1.5"
                    opacity="0.5"
                  />
                </svg>
                3D City
              </button>

              {/* Custom Tooltip */}
              <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 flex flex-col items-center opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
                <div className="w-2 h-2 bg-gray-950 dark:bg-zinc-800 border-l border-t border-white/10 dark:border-white/5 rotate-45 -mb-1 z-10" />
                <div className="whitespace-nowrap rounded-lg bg-gray-950 dark:bg-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-white dark:text-zinc-100 shadow-xl border border-white/10 dark:border-white/5">
                  {is3D ? 'Switch to flat view' : 'Switch to 3D City view'}
                </div>
              </div>
            </div>

            {/* ── Time Lapse View toggle ── */}
            <AnimatePresence>
              {is3D && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 'auto' }}
                  exit={{ opacity: 0, scale: 0.9, width: 0 }}
                  className="group relative flex justify-center overflow-hidden whitespace-nowrap"
                >
                  <button
                    onClick={() => setTimeLapseMode((v) => !v)}
                    aria-pressed={timeLapseMode}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      timeLapseMode
                        ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-500 dark:border-emerald-400/30 dark:bg-emerald-500/10'
                        : 'border-black/10 bg-transparent text-gray-500 hover:border-black/20 hover:text-black dark:border-white/10 dark:hover:border-white/20 dark:hover:text-white'
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Time-Lapse
                  </button>

                  {/* Custom Tooltip */}
                  <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 flex flex-col items-center opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
                    <div className="w-2 h-2 bg-gray-950 dark:bg-zinc-800 border-l border-t border-white/10 dark:border-white/5 rotate-45 -mb-1 z-10" />
                    <div className="whitespace-nowrap rounded-lg bg-gray-950 dark:bg-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-white dark:text-zinc-100 shadow-xl border border-white/10 dark:border-white/5">
                      {timeLapseMode ? 'Turn off Time-Lapse' : 'Turn on Time-Lapse'}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── 3D City view (conditionally rendered) ── */}
        {is3D && (
          <div className="mb-6">
            <Suspense
              fallback={
                <div className="flex h-[360px] w-full items-center justify-center rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
                    <span className="text-xs text-gray-400">Rendering city…</span>
                  </div>
                </div>
              }
            >
              <ContributionCity3D data={data} theme={theme3D} timeLapseMode={timeLapseMode} />
            </Suspense>
          </div>
        )}

        {/* Graph (hidden while 3D view is active) */}
        {!is3D && (
          <>
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
                      mode === 'loc'
                        ? t('dashboard.activity.lines_modified', {
                            count: val.toString(),
                            defaultValue: `${val} lines modified`,
                          })
                        : getContributionLabel(day.count, t)
                    } ${
                      day.startDate && day.startDate !== day.date
                        ? t('dashboard.activity.aria_range', {
                            start: formatTooltipDate(day.startDate),
                            end: formatTooltipDate(day.date),
                            defaultValue: `from ${formatTooltipDate(day.startDate)} to ${formatTooltipDate(day.date)}`,
                          })
                        : t('dashboard.activity.aria_single', {
                            date: formatTooltipDate(day.date),
                            defaultValue: `on ${formatTooltipDate(day.date)}`,
                          })
                    }`}
                    tabIndex={0}
                    onMouseEnter={(e) => showTooltip(e, day, val, heightPercent)}
                    onFocus={(e) => showTooltip(e, day, val, heightPercent)}
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
          </>
        )}
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
