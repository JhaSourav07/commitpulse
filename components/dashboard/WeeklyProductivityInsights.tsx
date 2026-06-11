'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Flame, Target, Zap, Calendar } from 'lucide-react';
import { CommitClockData } from '@/types/dashboard';
import type { ActivityData } from '@/types/dashboard';
import { useTranslation } from '@/context/TranslationContext';

interface WeeklyProductivityInsightsProps {
  commitClock: CommitClockData[];
  activity: ActivityData[];
  currentStreak: number;
}

/**
 * Calculates the most active day from commit clock data
 */
function getMostActiveDay(data: CommitClockData[]): {
  day: string;
  commits: number;
  percentage: number;
} {
  if (data.length === 0) {
    return { day: 'N/A', commits: 0, percentage: 0 };
  }

  const peakIndex = data.reduce((peak, d, i) => (d.commits > data[peak].commits ? i : peak), 0);
  const peak = data[peakIndex];
  const total = data.reduce((sum, d) => sum + d.commits, 0);

  return {
    day: peak.day,
    commits: peak.commits,
    percentage: total > 0 ? Math.round((peak.commits / total) * 100) : 0,
  };
}

/**
 * Calculates weekly growth percentage comparing last 7 days to previous 7 days
 */
function calculateWeeklyGrowth(activity: ActivityData[]): {
  growth: number;
  thisWeekTotal: number;
  lastWeekTotal: number;
  trend: 'up' | 'down' | 'stable';
} {
  if (activity.length < 14) {
    return { growth: 0, thisWeekTotal: 0, lastWeekTotal: 0, trend: 'stable' };
  }

  // Get last 7 days (most recent)
  const thisWeek = activity.slice(-7).reduce((sum, d) => sum + d.count, 0);

  // Get previous 7 days
  const lastWeek = activity.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);

  const growth = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
  const trend = growth > 5 ? 'up' : growth < -5 ? 'down' : 'stable';

  return { growth, thisWeekTotal: thisWeek, lastWeekTotal: lastWeek, trend };
}

/**
 * Determines productivity level based on activity
 */
function getProductivityLevel(
  thisWeekTotal: number,
  currentStreak: number
): { level: string; color: string; icon: string } {
  if (currentStreak >= 30) {
    return { level: 'Exceptional', color: 'from-purple-500 to-indigo-500', icon: '🌟' };
  }

  if (currentStreak >= 14 && thisWeekTotal >= 10) {
    return { level: 'Excellent', color: 'from-green-500 to-emerald-500', icon: '⚡' };
  }

  if (currentStreak >= 7 && thisWeekTotal >= 5) {
    return { level: 'Good', color: 'from-blue-500 to-cyan-500', icon: '✨' };
  }

  if (thisWeekTotal > 0) {
    return { level: 'Active', color: 'from-yellow-500 to-orange-500', icon: '🚀' };
  }

  return { level: 'Rest Day', color: 'from-gray-400 to-gray-500', icon: '😴' };
}

/**
 * Calculates commit streak contribution to weekly insights
 */
function getStreakInsight(currentStreak: number, peakStreak: number): string {
  if (currentStreak === 0) return 'Start a new streak!';
  if (currentStreak >= peakStreak) return `On fire! 🔥 Matching your best`;
  const remaining = peakStreak - currentStreak;
  return `${remaining} days to beat your record`;
}

export default function WeeklyProductivityInsights({
  commitClock,
  activity,
  currentStreak,
}: WeeklyProductivityInsightsProps) {
  const { t } = useTranslation();

  const mostActiveDay = getMostActiveDay(commitClock);
  const { growth, thisWeekTotal, trend } = calculateWeeklyGrowth(activity);
  const peakStreakFromClock = Math.max(...commitClock.map((d) => d.commits), 0);
  const productivityLevel = getProductivityLevel(thisWeekTotal, currentStreak);
  const streakInsight = getStreakInsight(currentStreak, peakStreakFromClock);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.14)] hover:shadow-[0_0_24px_rgba(99,102,241,0.08)] transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
          <Calendar size={15} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
            {t('dashboard.weekly_productivity.title') || 'Weekly Productivity'}
          </h3>
          <p className="text-xs text-[#A1A1AA]">
            {t('dashboard.weekly_productivity.subtitle') || 'Last 7 days insights'}
          </p>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="space-y-4">
        {/* Most Active Day */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05, duration: 0.2 }}
          className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-[rgba(255,255,255,0.05)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.1)] transition-all duration-200 group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-orange-500/20">
              <Target
                size={13}
                className="text-orange-600 dark:text-orange-400 group-hover:text-orange-500 transition-colors"
              />
            </div>
            <div>
              <p className="text-xs text-[#A1A1AA] font-medium">Most Active Day</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {mostActiveDay.day}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
              {mostActiveDay.percentage}%
            </span>
          </div>
        </motion.div>

        {/* Weekly Growth */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-[rgba(255,255,255,0.05)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.1)] transition-all duration-200 group"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded ${trend === 'up' ? 'bg-green-500/20' : trend === 'down' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}
            >
              <TrendingUp
                size={13}
                className={`${
                  trend === 'up'
                    ? 'text-green-600 dark:text-green-400 group-hover:text-green-500'
                    : trend === 'down'
                      ? 'text-red-600 dark:text-red-400 group-hover:text-red-500'
                      : 'text-blue-600 dark:text-blue-400 group-hover:text-blue-500'
                } transition-colors`}
              />
            </div>
            <div>
              <p className="text-xs text-[#A1A1AA] font-medium">Weekly Growth</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {thisWeekTotal} contributions
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
                trend === 'up'
                  ? 'text-green-600 dark:text-green-400 bg-green-500/10'
                  : trend === 'down'
                    ? 'text-red-600 dark:text-red-400 bg-red-500/10'
                    : 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
              }`}
            >
              {growth > 0 ? '+' : ''}
              {growth}%
            </span>
          </div>
        </motion.div>

        {/* Streak Status */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.2 }}
          className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-[rgba(255,255,255,0.05)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.1)] transition-all duration-200 group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-red-500/20">
              <Flame
                size={13}
                className="text-red-600 dark:text-red-400 group-hover:text-red-500 transition-colors"
              />
            </div>
            <div>
              <p className="text-xs text-[#A1A1AA] font-medium">Current Streak</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {currentStreak} days
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
              Active
            </span>
          </div>
        </motion.div>

        {/* Productivity Level */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.2 }}
          className={`flex items-center justify-between p-3 rounded-lg bg-gradient-to-r ${productivityLevel.color} bg-opacity-10 border border-black/10 dark:border-[rgba(255,255,255,0.05)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.1)] transition-all duration-200 group`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-white/10">
              <Zap
                size={13}
                className="text-gray-900 dark:text-white group-hover:text-white transition-colors"
              />
            </div>
            <div>
              <p className="text-xs text-[#A1A1AA] font-medium">Productivity Status</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {productivityLevel.level} {productivityLevel.icon}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Streak Insight */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.2 }}
          className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 dark:border-indigo-500/10"
        >
          <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium text-center">
            💡 {streakInsight}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
