'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Calendar, Flame } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { ActivityData } from '@/types/dashboard';

interface MonthData {
  monthKey: string; // "YYYY-MM"
  label: string; // short formatted e.g. "Jan '25"
  fullLabel: string; // full formatted e.g. "January 2025"
  commits: number;
  activityItems: ActivityData[];
}

export interface ContributionReplayProps {
  activity?: ActivityData[];
}

export default function ContributionReplay({ activity = [] }: ContributionReplayProps) {
  const { t } = useTranslation();

  // Controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1, 2, 4
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Chronologically sort and process activity data safely
  const processedData = useMemo(() => {
    const activityList = activity || [];
    const sorted = [...activityList].sort((a, b) => a.date.localeCompare(b.date));

    // Group by month YYYY-MM
    const monthsMap = new Map<string, { commits: number; items: ActivityData[] }>();
    let peakDay = { date: '', count: 0 };

    sorted.forEach((item) => {
      if (!item.date) return;
      const key = item.date.substring(0, 7); // "YYYY-MM"
      if (!monthsMap.has(key)) {
        monthsMap.set(key, { commits: 0, items: [] });
      }

      const group = monthsMap.get(key)!;
      group.commits += item.count || 0;
      group.items.push(item);

      if ((item.count || 0) > peakDay.count) {
        peakDay = { date: item.date, count: item.count };
      }
    });

    const monthsList: MonthData[] = Array.from(monthsMap.entries())
      .map(([monthKey, data]) => {
        let label = monthKey;
        let fullLabel = monthKey;

        const parts = monthKey.split('-');
        if (parts.length === 2) {
          const year = parts[0];
          const monthNum = parseInt(parts[1], 10);
          const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          const fullMonthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ];
          const idx = monthNum - 1;
          if (idx >= 0 && idx < 12) {
            label = `${monthNames[idx]} '${year.substring(2)}`;
            fullLabel = `${fullMonthNames[idx]} ${year}`;
          }
        }

        return {
          monthKey,
          label,
          fullLabel,
          commits: data.commits,
          activityItems: data.items,
        };
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    // Calculate cumulative sums
    const accumulatedCommits: number[] = [];
    let sum = 0;
    monthsList.forEach((m) => {
      sum += m.commits;
      accumulatedCommits.push(sum);
    });

    const maxMonthCommits = monthsList.reduce((max, m) => Math.max(max, m.commits), 0) || 1;

    return {
      monthsList,
      accumulatedCommits,
      peakDay,
      maxMonthCommits,
    };
  }, [activity]);

  const { monthsList, accumulatedCommits, peakDay, maxMonthCommits } = processedData;

  // Handle auto-playback ticks
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isPlaying && monthsList.length > 0) {
      const intervalTime = Math.max(100, 1000 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setCurrentMonthIndex((prevIndex) => {
          if (prevIndex >= monthsList.length - 1) {
            return 0; // Loop back
          }
          return prevIndex + 1;
        });
      }, intervalTime);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, monthsList.length]);

  // Clean up playback on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const activeMonth = monthsList[currentMonthIndex] || monthsList[0];
  const accumulatedSoFar = accumulatedCommits[currentMonthIndex] ?? 0;

  // Active month statistics breakdown (low, medium, high intensity)
  const activeMonthBreakdown = useMemo(() => {
    let low = 0;
    let medium = 0;
    let high = 0;
    if (!activeMonth || !activeMonth.activityItems) {
      return { low, medium, high };
    }
    activeMonth.activityItems.forEach((d) => {
      if (d.count > 0) {
        if (d.intensity <= 1) {
          low++;
        } else if (d.intensity <= 3) {
          medium++;
        } else {
          high++;
        }
      }
    });
    return { low, medium, high };
  }, [activeMonth]);

  // Empty state boundary check
  if (monthsList.length === 0) {
    return (
      <div
        role="region"
        aria-labelledby="replay-empty-title"
        className="p-8 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] text-center shadow-lg backdrop-blur-md"
      >
        <Calendar size={32} className="mx-auto mb-3 text-neutral-400 dark:text-neutral-600" />
        <h3
          id="replay-empty-title"
          className="text-base font-semibold text-gray-900 dark:text-white"
        >
          {t('dashboard.replay.title')}
        </h3>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {t('dashboard.replay.no_activity')}
        </p>
      </div>
    );
  }

  const speedOptions = [1, 2, 4];
  const speedIndex = speedOptions.indexOf(playbackSpeed);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentMonthIndex(0);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div
      role="region"
      aria-labelledby="contribution-replay-title"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] hover:shadow-[0_0_24px_rgba(99,102,241,0.04)] transition-all duration-300 relative overflow-hidden"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2
            id="contribution-replay-title"
            className="flex items-center gap-2 text-base font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            <Calendar size={18} className="text-indigo-500" />
            {t('dashboard.replay.title')}
          </h2>
          <p className="mt-1 text-xs text-[#A1A1AA]">{t('dashboard.replay.subtitle')}</p>
        </div>

        {/* Peak Activity Indicator */}
        {peakDay.count > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs">
            <Flame size={14} className="animate-pulse" />
            <span className="font-semibold">{t('dashboard.replay.peak_activity')}:</span>
            <span>
              {t('dashboard.replay.peak_commits', { count: peakDay.count.toString() })}{' '}
              {t('dashboard.replay.peak_date', { date: peakDay.date })}
            </span>
          </div>
        )}
      </div>

      {/* Main stats visual dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/40">
          <p className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-semibold">
            {t('dashboard.replay.active_month')}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {activeMonth.fullLabel}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/40">
          <p className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-semibold">
            {t('dashboard.replay.monthly_total')}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {activeMonth.commits}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/40">
          <p className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-semibold">
            {t('dashboard.replay.accumulated')}
          </p>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {accumulatedSoFar}
          </p>
        </div>
      </div>

      {/* Interactive Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Month Calendar Mini Grid */}
        <div className="p-5 rounded-xl bg-neutral-50 dark:bg-[#111] border border-neutral-200/50 dark:border-[rgba(255,255,255,0.06)] flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="text-xs font-semibold text-[#A1A1AA] mb-4 uppercase tracking-wider">
              {activeMonth.fullLabel} — Daily Rhythm
            </h3>

            {activeMonth.activityItems.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 italic py-8 text-center">
                {t('dashboard.replay.no_activity')}
              </p>
            ) : (
              <div
                className="grid grid-cols-7 gap-1 md:gap-1.5 max-w-sm mx-auto my-2"
                role="img"
                aria-label={`Mini contribution calendar grid for ${activeMonth.fullLabel}`}
              >
                {activeMonth.activityItems.map((day, idx) => {
                  let colorClass =
                    'bg-neutral-100 dark:bg-neutral-800/50 border border-transparent';
                  if (day.count > 0) {
                    if (day.intensity <= 1) {
                      colorClass = 'bg-indigo-500/20 border border-indigo-500/10 text-indigo-400';
                    } else if (day.intensity <= 3) {
                      colorClass = 'bg-indigo-500/50 border border-indigo-500/20 text-indigo-300';
                    } else {
                      colorClass =
                        'bg-indigo-500 border border-indigo-400 text-white shadow-[0_0_8px_rgba(99,102,241,0.4)]';
                    }
                  }

                  return (
                    <div
                      key={day.date || idx}
                      title={`${day.count} commits on ${day.date}`}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-bold select-none transition-all duration-200 ${colorClass}`}
                    >
                      {day.count > 0 ? day.count : ''}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Intensity counts breakdown */}
          <div className="mt-4 pt-4 border-t border-neutral-200/50 dark:border-neutral-800/40 flex justify-around text-[11px] text-[#A1A1AA]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/20" />
              <span>
                {t('dashboard.replay.intensity_low')}: {activeMonthBreakdown.low}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/50" />
              <span>
                {t('dashboard.replay.intensity_medium')}: {activeMonthBreakdown.medium}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-50 shadow-[0_0_6px_rgba(99,102,241,0.4)]" />
              <span>
                {t('dashboard.replay.intensity_high')}: {activeMonthBreakdown.high}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Histogram Chart */}
        <div className="p-5 rounded-xl bg-neutral-50 dark:bg-[#111] border border-neutral-200/50 dark:border-[rgba(255,255,255,0.06)] flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="text-xs font-semibold text-[#A1A1AA] mb-4 uppercase tracking-wider">
              {t('dashboard.replay.monthly_total')} Breakdown
            </h3>

            <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-2">
              {monthsList.map((m, idx) => {
                const heightPercentage = Math.max(
                  10,
                  Math.min(100, (m.commits / maxMonthCommits) * 100)
                );
                const isActive = idx === currentMonthIndex;
                const isPassed = idx <= currentMonthIndex;

                return (
                  <button
                    key={m.monthKey}
                    onClick={() => setCurrentMonthIndex(idx)}
                    title={`${m.fullLabel}: ${m.commits} commits`}
                    aria-label={t('dashboard.replay.aria_month', { month: m.fullLabel })}
                    className="flex-1 flex flex-col items-center h-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm cursor-pointer"
                  >
                    <div className="w-full h-full flex items-end">
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-t from-violet-600 to-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]'
                            : isPassed
                              ? 'bg-indigo-500/60 group-hover:bg-indigo-500/80'
                              : 'bg-neutral-200 dark:bg-neutral-800 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-700'
                        }`}
                        style={{ height: `${heightPercentage}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-[#A1A1AA] font-mono border-t border-neutral-200/50 dark:border-neutral-800/40 pt-2 px-1">
            <span>{monthsList[0]?.label}</span>
            <span>{monthsList[monthsList.length - 1]?.label}</span>
          </div>
        </div>
      </div>

      {/* Playback Controls & Timeline Slider */}
      <div className="space-y-4 pt-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
        {/* Manual Timeline Scrub Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-[#A1A1AA] px-1 font-mono">
            <span>{activeMonth.fullLabel}</span>
            <span>
              {currentMonthIndex + 1} / {monthsList.length}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={monthsList.length - 1}
            value={currentMonthIndex}
            onChange={(e) => setCurrentMonthIndex(parseInt(e.target.value, 10))}
            aria-label={t('dashboard.replay.aria_scrub')}
            className="w-full accent-indigo-500 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none h-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          />
        </div>

        {/* Buttons and Speed controls panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? t('dashboard.replay.pause') : t('dashboard.replay.play')}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-200 hover:scale-[1.04] active:scale-[0.98] shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none cursor-pointer"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              onClick={handleReset}
              aria-label={t('dashboard.replay.reset')}
              className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-neutral-100 dark:bg-neutral-900/60 hover:bg-neutral-200 dark:hover:bg-neutral-800/80 text-gray-800 dark:text-neutral-200 font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none cursor-pointer"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Speed Multiplier controls */}
          <div className="flex items-center gap-3 bg-neutral-100/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 p-2 rounded-xl">
            <label id="speed-label" className="text-xs font-semibold text-[#A1A1AA]">
              {t('dashboard.replay.speed')}:
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={speedIndex === -1 ? 0 : speedIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                setPlaybackSpeed(speedOptions[idx]);
              }}
              aria-labelledby="speed-label"
              aria-label={t('dashboard.replay.aria_speed')}
              className="w-24 accent-indigo-500 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none h-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
            />
            <span className="text-xs font-bold text-gray-900 dark:text-white min-w-[24px]">
              {t('dashboard.replay.speed_value', { speed: playbackSpeed.toString() })}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Month Navigation Bar */}
      <div
        className="mt-6 flex overflow-x-auto gap-2 no-scrollbar scroll-smooth py-2 px-1 border-t border-neutral-100 dark:border-neutral-900"
        role="navigation"
        aria-label="Replay months list navigation"
      >
        {monthsList.map((m, idx) => {
          const isActive = idx === currentMonthIndex;
          return (
            <button
              key={m.monthKey}
              onClick={() => setCurrentMonthIndex(idx)}
              aria-label={t('dashboard.replay.aria_month', { month: m.fullLabel })}
              aria-current={isActive ? 'true' : 'false'}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold select-none border transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none ${
                isActive
                  ? 'bg-indigo-600 text-white border-transparent shadow-[0_2px_8px_rgba(99,102,241,0.4)]'
                  : 'bg-white dark:bg-neutral-900/60 text-[#A1A1AA] hover:text-gray-800 dark:hover:text-white border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
