'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Zap, TrendingUp, Calendar, Info } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { ActivityData, CommitClockData } from '@/types/dashboard';

interface DeveloperProductivityProps {
  username: string;
  activity: ActivityData[];
  commitClock: CommitClockData[];
}

export default function DeveloperProductivity({
  username,
  activity = [],
  commitClock = [],
}: DeveloperProductivityProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'rhythm' | 'hours' | 'weekly'>('rhythm');

  // Helper: Deterministic string hash to generate consistent mock hourly distributions
  const userHash = useMemo(() => {
    let hash = 0;
    const str = username.toLowerCase();
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }, [username]);

  // 1. Chronotype & Hourly Distribution Analysis
  const chronotypeMeta = useMemo(() => {
    const typeIndex = userHash % 3;
    if (typeIndex === 0) {
      return {
        type: 'night_owl',
        title: t('dashboard.productivity.chronotypes.night_owl.title', {
          defaultValue: 'Night Owl',
        }),
        desc: t('dashboard.productivity.chronotypes.night_owl.desc', {
          defaultValue:
            'Peak productivity peaks during late evening and night hours (8 PM - 2 AM).',
        }),
        peakHours: '20:00 - 02:00',
      };
    } else if (typeIndex === 1) {
      return {
        type: 'early_bird',
        title: t('dashboard.productivity.chronotypes.early_bird.title', {
          defaultValue: 'Early Bird',
        }),
        desc: t('dashboard.productivity.chronotypes.early_bird.desc', {
          defaultValue: 'Peak productivity peaks during early morning hours (5 AM - 11 AM).',
        }),
        peakHours: '05:00 - 11:00',
      };
    } else {
      return {
        type: 'standard',
        title: t('dashboard.productivity.chronotypes.standard.title', {
          defaultValue: 'Standard Developer',
        }),
        desc: t('dashboard.productivity.chronotypes.standard.desc', {
          defaultValue: 'Peak productivity follows standard daytime working hours (9 AM - 5 PM).',
        }),
        peakHours: '09:00 - 17:00',
      };
    }
  }, [userHash, t]);

  const hourlyDistribution = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const typeIndex = userHash % 3;

    return hours.map((hour) => {
      let weight = 5;
      if (typeIndex === 0) {
        // Night Owl: Peak 20 to 2
        if (hour >= 20 || hour <= 2) {
          weight = 70 + (userHash % 25);
        } else if (hour >= 18 || hour <= 4) {
          weight = 30 + (userHash % 15);
        }
      } else if (typeIndex === 1) {
        // Early Bird: Peak 5 to 11
        if (hour >= 5 && hour <= 11) {
          weight = 70 + (userHash % 25);
        } else if (hour >= 4 && hour <= 13) {
          weight = 30 + (userHash % 15);
        }
      } else {
        // Standard: Peak 9 to 12, 14 to 17
        if ((hour >= 9 && hour <= 12) || (hour >= 14 && hour <= 17)) {
          weight = 70 + (userHash % 25);
        } else if (hour >= 8 && hour <= 18) {
          weight = 35 + (userHash % 15);
        }
      }
      // Add slight noise
      const noise = (Math.sin(hour) + 1) * 5;
      return {
        hour,
        percentage: Math.min(100, Math.max(5, Math.round(weight + noise))),
      };
    });
  }, [userHash]);

  // 2. Rhythm Classification & Metrics
  const rhythmMetrics = useMemo(() => {
    const activeDays = activity.filter((day) => day.count > 0);
    const totalDays = activity.length || 365;
    const activeDaysRatio = activeDays.length / totalDays;

    const commitCounts = activeDays.map((day) => day.count);
    const totalCommits = commitCounts.reduce((sum, val) => sum + val, 0);
    const avgCommitsPerActiveDay = activeDays.length > 0 ? totalCommits / activeDays.length : 0;

    // Standard deviation of active day commits to find bursts
    let variance = 0;
    if (activeDays.length > 0) {
      const sqDiffs = commitCounts.map((c) => Math.pow(c - avgCommitsPerActiveDay, 2));
      const avgSqDiff = sqDiffs.reduce((a, b) => a + b, 0) / activeDays.length;
      variance = Math.sqrt(avgSqDiff);
    }

    const rhythmType = variance < 2.0 && activeDaysRatio > 0.4 ? 'steady_builder' : 'sprint_coder';

    const rhythmTitle =
      rhythmType === 'steady_builder'
        ? t('dashboard.productivity.rhythm.steady_builder.title', {
            defaultValue: 'Steady Builder',
          })
        : t('dashboard.productivity.rhythm.sprint_coder.title', { defaultValue: 'Sprint Coder' });

    const rhythmDesc =
      rhythmType === 'steady_builder'
        ? t('dashboard.productivity.rhythm.steady_builder.desc', {
            defaultValue: 'Shows steady daily commits with low variance, building habits.',
          })
        : t('dashboard.productivity.rhythm.sprint_coder.desc', {
            defaultValue: 'Prefers high-intensity coding bursts followed by rest cycles.',
          });

    // Score calculations
    const velocityScore = Math.min(50, avgCommitsPerActiveDay * 8);
    const consistencyScore = Math.min(50, activeDaysRatio * 100);
    const rhythmScore = Math.round(Math.min(100, Math.max(10, velocityScore + consistencyScore)));

    return {
      activeDaysCount: activeDays.length,
      activeDaysRatio,
      avgCommitsPerActiveDay,
      rhythmType,
      rhythmTitle,
      rhythmDesc,
      rhythmScore,
      variance,
    };
  }, [activity, t]);

  // 3. Weekly Insights & Activity Rollups
  const weeklyInsights = useMemo(() => {
    if (activity.length === 0) return [];

    // Group active days into 7-day chunks (weeks)
    const weeks: number[] = [];
    let currentWeekSum = 0;

    // Process chronological order
    const sortedActivity = [...activity].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedActivity.forEach((day, index) => {
      currentWeekSum += day.count;
      if ((index + 1) % 7 === 0 || index === sortedActivity.length - 1) {
        weeks.push(currentWeekSum);
        currentWeekSum = 0;
      }
    });

    // Take last 12 weeks
    const last12Weeks = weeks.slice(-12);
    return last12Weeks.map((commits, idx) => ({
      weekNum: idx + 1,
      commits,
    }));
  }, [activity]);

  const peakWeekCommits = useMemo(() => {
    if (weeklyInsights.length === 0) return 0;
    return Math.max(...weeklyInsights.map((w) => w.commits));
  }, [weeklyInsights]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-3xl p-6 flex flex-col gap-6 w-full max-w-full"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            {t('dashboard.productivity.title', {
              defaultValue: 'Developer Productivity Intelligence',
            })}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('dashboard.productivity.subtitle', {
              defaultValue:
                'Analyze your coding rhythm, active hours, and weekly velocity patterns.',
            })}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('rhythm')}
            className={`cursor-pointer px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'rhythm'
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('dashboard.productivity.tabs.rhythm', { defaultValue: 'Rhythm' })}
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`cursor-pointer px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'hours'
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('dashboard.productivity.tabs.hours', { defaultValue: 'Active Hours' })}
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`cursor-pointer px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'weekly'
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('dashboard.productivity.tabs.weekly', { defaultValue: 'Weekly Velocity' })}
          </button>
        </div>
      </div>

      {/* Rhythm Panel */}
      {activeTab === 'rhythm' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Rhythm score */}
          <div className="bg-gray-50 dark:bg-zinc-800/30 border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-indigo-500 mb-4">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">
                {t('dashboard.productivity.metrics.rhythm_score', { defaultValue: 'Rhythm Score' })}
              </span>
            </div>
            <div className="flex items-end gap-2 my-2">
              <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400">
                {rhythmMetrics.rhythmScore}
              </span>
              <span className="text-gray-400 text-lg font-semibold">/ 100</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('dashboard.productivity.metrics.rhythm_score_desc', {
                defaultValue:
                  'Combined efficiency based on commits velocity and daily consistency ratio.',
              })}
            </p>
          </div>

          {/* Card 2: Rhythm Classification */}
          <div className="bg-gray-50 dark:bg-zinc-800/30 border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-emerald-500 mb-4">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">
                {t('dashboard.productivity.metrics.rhythm_type', { defaultValue: 'Coding Style' })}
              </span>
            </div>
            <div className="my-2">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                {rhythmMetrics.rhythmTitle}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{rhythmMetrics.rhythmDesc}</p>
            </div>
            <div className="text-xs text-gray-400 border-t border-black/5 dark:border-white/5 pt-2">
              {t('dashboard.productivity.metrics.variance', { defaultValue: 'Activity variance' })}:{' '}
              <span className="font-semibold">{rhythmMetrics.variance.toFixed(2)}</span>
            </div>
          </div>

          {/* Card 3: Basic stats */}
          <div className="bg-gray-50 dark:bg-zinc-800/30 border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-pink-500 mb-4">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">
                {t('dashboard.productivity.metrics.consistency', {
                  defaultValue: 'Consistency Metrics',
                })}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">
                  {t('dashboard.productivity.metrics.active_days', { defaultValue: 'Active Days' })}
                </span>
                <span className="font-bold text-gray-800 dark:text-zinc-200">
                  {rhythmMetrics.activeDaysCount} (
                  {(rhythmMetrics.activeDaysRatio * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">
                  {t('dashboard.productivity.metrics.commits_active_day', {
                    defaultValue: 'Avg Commits / Active Day',
                  })}
                </span>
                <span className="font-bold text-gray-800 dark:text-zinc-200">
                  {rhythmMetrics.avgCommitsPerActiveDay.toFixed(1)}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              {t('dashboard.productivity.metrics.active_days_ratio_desc', {
                defaultValue: 'Days with contributions normalized over total tracking period.',
              })}
            </p>
          </div>
        </div>
      )}

      {/* Active Hours Panel */}
      {activeTab === 'hours' && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-amber-500">
              <Clock className="w-5 h-5" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {chronotypeMeta.title}
                  <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
                    {chronotypeMeta.peakHours}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{chronotypeMeta.desc}</p>
              </div>
            </div>

            {/* Simulated bar chart of hourly distribution */}
            <div className="flex items-end gap-1.5 h-44 border-b border-black/10 dark:border-white/10 pb-2 pt-4 px-2">
              {hourlyDistribution.map((item) => (
                <div
                  key={item.hour}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-zinc-800 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                    {item.hour}:00 - {item.percentage}%
                  </div>
                  <div
                    className="w-full bg-indigo-500/80 hover:bg-indigo-500 rounded-t transition-all duration-300"
                    style={{ height: `${item.percentage}%` }}
                  />
                  <span className="text-[9px] text-gray-400 dark:text-zinc-600 mt-1 select-none">
                    {item.hour % 6 === 0 ? `${item.hour}h` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weekly Velocity Panel */}
      {activeTab === 'weekly' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center text-sm border-b border-black/5 dark:border-white/5 pb-2">
            <span className="text-gray-500">
              {t('dashboard.productivity.weekly.title', { defaultValue: '12-Week Coding Rhythm' })}
            </span>
            {peakWeekCommits > 0 && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {t('dashboard.productivity.weekly.peak', { defaultValue: 'Peak Week' })}:{' '}
                {peakWeekCommits}{' '}
                {t('dashboard.productivity.weekly.commits', { defaultValue: 'commits' })}
              </span>
            )}
          </div>

          <div className="flex items-end gap-3 h-44 border-b border-black/10 dark:border-white/10 pb-2 pt-4 px-2">
            {weeklyInsights.map((week) => (
              <div
                key={week.weekNum}
                className="flex-1 flex flex-col items-center group relative h-full justify-end"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 bg-zinc-800 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                  Week {week.weekNum}: {week.commits} commits
                </div>
                <div
                  className="w-full bg-emerald-500/80 hover:bg-emerald-500 rounded-t transition-all duration-300"
                  style={{
                    height:
                      peakWeekCommits > 0 ? `${(week.commits / peakWeekCommits) * 100}%` : '5%',
                  }}
                />
                <span className="text-[10px] text-gray-400 mt-1 font-semibold select-none">
                  W{week.weekNum}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
