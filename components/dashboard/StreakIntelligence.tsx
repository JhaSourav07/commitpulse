'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Compass, Award, ShieldAlert, Sparkles } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { ActivityData } from '@/types/dashboard';

interface StreakIntelligenceProps {
  activity: ActivityData[];
  stats: {
    currentStreak: number;
    peakStreak: number;
    totalContributions: number;
  };
}

export default function StreakIntelligence({ activity = [], stats }: StreakIntelligenceProps) {
  const { t } = useTranslation();

  const currentStreak = stats?.currentStreak ?? 0;
  const peakStreak = stats?.peakStreak ?? 0;

  // 1. Calculate survival probability & stats
  const calculations = useMemo(() => {
    if (activity.length === 0) {
      return {
        probability: 50,
        averageGap: 0,
        upcomingMilestone: 10,
        daysToMilestone: 10,
        recommendationKey: 'standard',
        recommendationText: 'Start a commit streak today to see predictive survival modeling.',
      };
    }

    // Get last 30 days
    const sortedActivity = [...activity].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const last30 = sortedActivity.slice(0, 30);
    const activeDaysLast30 = last30.filter((d) => d.count > 0).length;
    const ratio = activeDaysLast30 / 30;

    // Deterministic survival probability
    let probability = Math.round(30 + ratio * 65);
    if (currentStreak > 0) {
      probability = Math.min(99, probability + Math.min(5, Math.floor(currentStreak / 10)));
    } else {
      probability = Math.max(15, probability - 15);
    }

    // Find gaps between active days in the last 90 days
    const activeDates = sortedActivity
      .slice(0, 90)
      .filter((d) => d.count > 0)
      .map((d) => new Date(d.date).getTime());

    let totalGap = 0;
    let gapCount = 0;
    for (let i = 0; i < activeDates.length - 1; i++) {
      const gapDays = (activeDates[i] - activeDates[i + 1]) / (1000 * 60 * 60 * 24);
      totalGap += gapDays;
      gapCount++;
    }
    const averageGap = gapCount > 0 ? parseFloat((totalGap / gapCount).toFixed(1)) : 1.0;

    // Upcoming Milestone Detection
    let upcomingMilestone = 7;
    const milestones = [7, 14, 30, 50, 100, 200, 365];
    if (currentStreak >= peakStreak && peakStreak > 0) {
      // If they are beating/equal to their peak streak, set milestone above current
      const nextTarget = milestones.find((m) => m > currentStreak);
      upcomingMilestone = nextTarget ?? currentStreak + 10;
    } else {
      upcomingMilestone = peakStreak;
    }
    const daysToMilestone = Math.max(1, upcomingMilestone - currentStreak);

    // Recommendation logic based on recent commit status
    let recommendationKey = 'standard';
    let recommendationText = t('dashboard.streak.recs.standard', {
      defaultValue: 'Keep a consistent daily schedule to build muscle memory.',
    });

    const committedToday = last30[0] && last30[0].count > 0;
    if (currentStreak > 0 && !committedToday) {
      recommendationKey = 'critical';
      recommendationText = t('dashboard.streak.recs.critical', {
        defaultValue: 'Your streak is at risk! Commit before midnight UTC to prevent resets.',
      });
    } else if (ratio > 0.8) {
      recommendationKey = 'elite';
      recommendationText = t('dashboard.streak.recs.elite', {
        defaultValue:
          'Elite coding patterns detected. Make sure to schedule rest days to prevent burnout.',
      });
    } else if (averageGap > 3) {
      recommendationKey = 'gap_warning';
      recommendationText = t('dashboard.streak.recs.gap', {
        defaultValue:
          'Longer commit gaps detected. Try setting a daily reminder or booking focus slots.',
      });
    }

    return {
      probability,
      averageGap,
      upcomingMilestone,
      daysToMilestone,
      recommendationKey,
      recommendationText,
    };
  }, [activity, currentStreak, peakStreak, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full p-6 rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-lg border border-gray-200/50 dark:border-neutral-800/50 shadow-xl flex flex-col gap-6"
    >
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-gray-200/40 dark:border-neutral-800/40 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {t('dashboard.streak.title', { defaultValue: 'GitHub Streak Intelligence' })}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('dashboard.streak.subtitle', {
                defaultValue: 'Predictive modeling, survival rates, and recovery recommendations.',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Probability Card */}
        <div className="bg-gray-50/50 dark:bg-zinc-800/20 border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-indigo-500 mb-4">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              {t('dashboard.streak.probability_label', { defaultValue: 'Survival Probability' })}
            </span>
          </div>
          <div className="flex items-end gap-2 my-2">
            <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400">
              {calculations.probability}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t('dashboard.streak.probability_desc', {
              defaultValue: 'Calculated using recent active days ratios and commit intervals.',
            })}
          </p>
        </div>

        {/* Recovery/Recommendation Card */}
        <div className="bg-gray-50/50 dark:bg-zinc-800/20 border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-amber-500 mb-4">
            <Compass className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              {t('dashboard.streak.recovery_label', { defaultValue: 'Recovery Insights' })}
            </span>
          </div>
          <div className="my-2">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {calculations.recommendationText}
            </p>
          </div>
          <div className="text-xs text-gray-400 border-t border-black/5 dark:border-white/5 pt-2 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            {t('dashboard.streak.avg_gap_label', { defaultValue: 'Average gap' })}:{' '}
            <span className="font-semibold">{calculations.averageGap} days</span>
          </div>
        </div>

        {/* Milestone Tracker Card */}
        <div className="bg-gray-50/50 dark:bg-zinc-800/20 border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-emerald-500 mb-4">
            <Award className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              {t('dashboard.streak.milestone_label', { defaultValue: 'Upcoming Streak Milestone' })}
            </span>
          </div>
          <div className="my-2">
            <h4 className="text-lg font-extrabold text-gray-900 dark:text-white">
              {calculations.upcomingMilestone}{' '}
              {t('dashboard.streak.days', { defaultValue: 'Days' })}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {t('dashboard.streak.milestone_desc', {
                defaultValue: '{{days}} days remaining until you reach this target.',
                days: calculations.daysToMilestone.toString(),
              })}
            </p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden mt-4">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (currentStreak / calculations.upcomingMilestone) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
