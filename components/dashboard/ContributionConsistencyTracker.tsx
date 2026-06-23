'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Compass, BarChart2, Zap } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { ActivityData } from '@/types/dashboard';

export interface ContributionConsistencyTrackerProps {
  activity: ActivityData[];
}

export default function ContributionConsistencyTracker({
  activity = [],
}: ContributionConsistencyTrackerProps) {
  const { t } = useTranslation();

  // 1. Streak Engine Calculations
  const streakStats = useMemo(() => {
    if (!activity || activity.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }
    // Sort activity chronologically
    const sorted = [...activity].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    // We calculate streaks simply by checking consecutive days with commits > 0
    sorted.forEach((day) => {
      if (day.count > 0) {
        tempStreak++;
        if (tempStreak > longest) {
          longest = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    });

    // Determine current streak by walking backward from the last day in activity list
    current = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      // If the last day has 0 commits, check if yesterday had commits (allow 1 day grace for timezone/today lag)
      if (i === sorted.length - 1 && sorted[i].count === 0) {
        continue;
      }
      if (sorted[i].count > 0) {
        current++;
      } else {
        break;
      }
    }

    return {
      currentStreak: current,
      longestStreak: longest,
    };
  }, [activity]);

  // 2. Weekday vs Weekend Bias
  const biasStats = useMemo(() => {
    let weekdayCommits = 0;
    let weekendCommits = 0;

    activity.forEach((day) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendCommits += day.count;
      } else {
        weekdayCommits += day.count;
      }
    });

    const total = weekdayCommits + weekendCommits;
    const weekdayPct = total > 0 ? Math.round((weekdayCommits / total) * 100) : 0;
    const weekendPct = total > 0 ? Math.round((weekendCommits / total) * 100) : 0;

    let biasLabel = t('dashboard.consistency.bias_balanced', { defaultValue: 'Balanced Coder' });
    if (weekdayPct > 80) {
      biasLabel = t('dashboard.consistency.bias_warrior', { defaultValue: 'Weekday Warrior' });
    } else if (weekendPct > 30) {
      biasLabel = t('dashboard.consistency.bias_builder', { defaultValue: 'Weekend Builder' });
    }

    return {
      weekdayPct,
      weekendPct,
      biasLabel,
    };
  }, [activity, t]);

  // 3. Yearly Stability Index
  const yearlyStability = useMemo(() => {
    const yearsMap: Record<string, { active: number; total: number }> = {};

    activity.forEach((day) => {
      const year = new Date(day.date).getFullYear().toString();
      if (!yearsMap[year]) {
        yearsMap[year] = { active: 0, total: 0 };
      }
      yearsMap[year].total++;
      if (day.count > 0) {
        yearsMap[year].active++;
      }
    });

    return Object.entries(yearsMap)
      .map(([year, data]) => {
        const index = data.total > 0 ? Math.round((data.active / data.total) * 100) : 0;
        return {
          year,
          index,
          active: data.active,
          total: data.total,
        };
      })
      .sort((a, b) => b.year.localeCompare(a.year));
  }, [activity]);

  // Handle empty state gracefully
  if (!activity || activity.length === 0) {
    return (
      <motion.div
        role="region"
        aria-labelledby="consistency-tracker-title"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 rounded-xl bg-white/50 dark:bg-neutral-950/50 backdrop-blur-md border border-gray-200/50 dark:border-neutral-800/50 shadow-md flex flex-col justify-center items-center min-h-[300px]"
      >
        <h3
          id="consistency-tracker-title"
          className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4"
        >
          <Flame className="w-5 h-5 text-orange-500" />
          {t('dashboard.consistency.title', { defaultValue: 'Contribution Consistency Tracker' })}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
          {t('dashboard.consistency.no_data', { defaultValue: 'No consistency data available.' })}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      role="region"
      aria-labelledby="consistency-tracker-title"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full p-6 rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-lg border border-gray-200/50 dark:border-neutral-800/50 shadow-xl flex flex-col gap-6"
    >
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/40 dark:border-neutral-800/40 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="consistency-tracker-title"
              className="text-base font-bold text-zinc-900 dark:text-white"
            >
              {t('dashboard.consistency.title', {
                defaultValue: 'Contribution Consistency Tracker',
              })}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('dashboard.consistency.subtitle', {
                defaultValue:
                  'Track your commit streaks, weekday activity bias, and yearly stability trends.',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak Analyzer Card */}
        <div className="bg-gray-50/50 dark:bg-zinc-800/30 border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-orange-500 mb-4">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">
              {t('dashboard.consistency.active_streak', { defaultValue: 'Active Streak' })}
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-orange-600 dark:text-orange-400">
                {streakStats.currentStreak}
              </span>
              <span className="text-gray-400 text-lg font-semibold">
                {t('dashboard.consistency.days', { defaultValue: 'Days' })}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('dashboard.consistency.peak_streak', { defaultValue: 'Peak Streak' })}:{' '}
              {streakStats.longestStreak}{' '}
              {t('dashboard.consistency.days', { defaultValue: 'Days' })}
            </p>
          </div>
        </div>

        {/* Activity Bias Card */}
        <div className="bg-gray-50/50 dark:bg-zinc-800/30 border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-indigo-500 mb-4">
            <Compass className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">
              {t('dashboard.consistency.weekday_bias', { defaultValue: 'Activity Bias' })}
            </span>
          </div>
          <div className="my-2">
            <h4 className="text-xl font-extrabold text-gray-900 dark:text-white">
              {biasStats.biasLabel}
            </h4>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {t('dashboard.consistency.weekday_value', { defaultValue: 'Weekdays' })}
                </span>
                <span className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                  {biasStats.weekdayPct}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {t('dashboard.consistency.weekend_value', { defaultValue: 'Weekends' })}
                </span>
                <span className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                  {biasStats.weekendPct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stability Index Card */}
        <div className="bg-gray-50/50 dark:bg-zinc-800/30 border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-emerald-500 mb-4">
            <BarChart2 className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">
              {t('dashboard.consistency.stability', { defaultValue: 'Stability Index' })}
            </span>
          </div>
          <div className="flex flex-col gap-2 max-h-[100px] overflow-y-auto pr-1">
            {yearlyStability.slice(0, 3).map((y) => (
              <div key={y.year} className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{y.year}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${y.index}%` }}
                    />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-zinc-200 font-mono">
                    {y.index}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
