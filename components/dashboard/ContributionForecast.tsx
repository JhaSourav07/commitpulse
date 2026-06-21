'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Calendar,
  Zap,
  LineChart,
  Activity,
  Target,
} from 'lucide-react';
import type { ActivityData } from '@/types/dashboard';
import { useTranslation } from '@/context/TranslationContext';

interface ContributionForecastProps {
  activity: ActivityData[];
  totalContributions?: number;
}

export default function ContributionForecast({
  activity = [],
  totalContributions,
}: ContributionForecastProps) {
  const { t } = useTranslation();

  const calculations = useMemo(() => {
    if (!activity || activity.length === 0) {
      return {
        weeklyVelocity: 0,
        monthlyVelocity: 0,
        projectedMonthEndTotal: totalContributions || 0,
        projectedYearEndTotal: totalContributions || 0,
        consistencyScore: 0,
        consistencyLevel: 'inactive',
        slope: 0,
        trendType: 'stable',
        hasActivity: false,
      };
    }

    const N = activity.length;
    const currentTotal =
      totalContributions !== undefined
        ? totalContributions
        : activity.reduce((sum, d) => sum + d.count, 0);

    // 1. Average Daily, Weekly, Monthly Velocity
    const totalActivityCommits = activity.reduce((sum, d) => sum + d.count, 0);
    const avgDaily = totalActivityCommits / N;
    const weeklyVelocity = avgDaily * 7;
    const monthlyVelocity = avgDaily * 30;

    // 2. Linear Regression (slope m and intercept c)
    // x_i = i, y_i = activity[i].count
    const meanX = (N - 1) / 2;
    const meanY = totalActivityCommits / N;

    let num = 0;
    let den = 0;
    for (let i = 0; i < N; i++) {
      const xDiff = i - meanX;
      num += xDiff * (activity[i].count - meanY);
      den += xDiff * xDiff;
    }

    const slope = den !== 0 ? num / den : 0;
    const intercept = meanY - slope * meanX;

    // 3. Date Projections
    // Use the date of the last entry in activity as "current date", fallback to new Date()
    const lastEntryDateStr = activity[N - 1].date;
    let currentDate = new Date(lastEntryDateStr);
    if (isNaN(currentDate.getTime())) {
      currentDate = new Date();
    }

    // End of Month
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const timeDiffMonth = endOfMonth.getTime() - currentDate.getTime();
    const daysRemainingInMonth = Math.max(0, Math.ceil(timeDiffMonth / (1000 * 60 * 60 * 24)));

    // End of Year
    const endOfYear = new Date(currentDate.getFullYear(), 11, 31);
    const timeDiffYear = endOfYear.getTime() - currentDate.getTime();
    const daysRemainingInYear = Math.max(0, Math.ceil(timeDiffYear / (1000 * 60 * 60 * 24)));

    // Loop to sum predicted future daily commits (guaranteed non-negative)
    let projectedMonthExtra = 0;
    for (let d = 1; d <= daysRemainingInMonth; d++) {
      // day index for future day is N - 1 + d
      const projectedDaily = slope * (N - 1 + d) + intercept;
      projectedMonthExtra += Math.max(0, projectedDaily);
    }
    const projectedMonthEndTotal = Math.round(currentTotal + projectedMonthExtra);

    let projectedYearExtra = 0;
    for (let d = 1; d <= daysRemainingInYear; d++) {
      const projectedDaily = slope * (N - 1 + d) + intercept;
      projectedYearExtra += Math.max(0, projectedDaily);
    }
    const projectedYearEndTotal = Math.round(currentTotal + projectedYearExtra);

    // 4. Consistency Score
    // Active days (days with count > 0)
    const activeDays = activity.filter((d) => d.count > 0).length;
    const activeRatio = activeDays / N;
    const consistencyScore = Math.min(100, Math.round(activeRatio * 100));

    let consistencyLevel: 'elite' | 'consistent' | 'occasional' | 'sporadic' | 'inactive' =
      'inactive';
    if (consistencyScore >= 85) {
      consistencyLevel = 'elite';
    } else if (consistencyScore >= 60) {
      consistencyLevel = 'consistent';
    } else if (consistencyScore >= 30) {
      consistencyLevel = 'occasional';
    } else if (consistencyScore > 0) {
      consistencyLevel = 'sporadic';
    }

    // 5. Trend slope categorization
    let trendType: 'strong_growth' | 'moderate_growth' | 'stable' | 'cooling' | 'decline' =
      'stable';
    if (slope > 0.02) {
      trendType = 'strong_growth';
    } else if (slope > 0.005) {
      trendType = 'moderate_growth';
    } else if (slope < -0.02) {
      trendType = 'decline';
    } else if (slope < -0.005) {
      trendType = 'cooling';
    }

    return {
      weeklyVelocity,
      monthlyVelocity,
      projectedMonthEndTotal,
      projectedYearEndTotal,
      consistencyScore,
      consistencyLevel,
      slope,
      trendType,
      hasActivity: true,
    };
  }, [activity, totalContributions]);

  const {
    weeklyVelocity,
    monthlyVelocity,
    projectedMonthEndTotal,
    projectedYearEndTotal,
    consistencyScore,
    consistencyLevel,
    slope,
    trendType,
    hasActivity,
  } = calculations;

  const getTrendIcon = () => {
    switch (trendType) {
      case 'strong_growth':
      case 'moderate_growth':
        return <TrendingUp className="text-emerald-500 dark:text-emerald-400" size={18} />;
      case 'decline':
      case 'cooling':
        return <TrendingDown className="text-rose-500 dark:text-rose-400" size={18} />;
      default:
        return <Minus className="text-zinc-400 dark:text-[#A1A1AA]" size={18} />;
    }
  };

  const getTrendColorClass = () => {
    switch (trendType) {
      case 'strong_growth':
      case 'moderate_growth':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'decline':
      case 'cooling':
        return 'text-rose-600 dark:text-rose-400';
      default:
        return 'text-zinc-500 dark:text-[#A1A1AA]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <LineChart size={18} className="text-zinc-500 dark:text-[#A1A1AA]" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              {t('dashboard.forecast.title')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
              {t('dashboard.forecast.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {!hasActivity ? (
        <div className="p-8 text-center border border-dashed border-black/10 dark:border-[rgba(255,255,255,0.08)] rounded-lg text-zinc-400 dark:text-[#A1A1AA]">
          <Activity size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-xs">{t('dashboard.forecast.no_activity')}</p>
        </div>
      ) : (
        <>
          {/* Main Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-lg bg-gray-50 dark:bg-[#111] border border-black/5 dark:border-[rgba(255,255,255,0.05)]"
            >
              <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] mb-2">
                <span className="text-xs font-medium">
                  {t('dashboard.forecast.weekly_velocity')}
                </span>
                <Zap size={14} />
              </div>
              <div className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">
                {t('dashboard.forecast.commits_per_week', { count: weeklyVelocity.toFixed(1) })}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-lg bg-gray-50 dark:bg-[#111] border border-black/5 dark:border-[rgba(255,255,255,0.05)]"
            >
              <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] mb-2">
                <span className="text-xs font-medium">
                  {t('dashboard.forecast.monthly_velocity')}
                </span>
                <Calendar size={14} />
              </div>
              <div className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">
                {t('dashboard.forecast.commits_per_month', { count: monthlyVelocity.toFixed(1) })}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-lg bg-gray-50 dark:bg-[#111] border border-black/5 dark:border-[rgba(255,255,255,0.05)]"
            >
              <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] mb-2">
                <span className="text-xs font-medium">
                  {t('dashboard.forecast.projected_month')}
                </span>
                <Target size={14} />
              </div>
              <div className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">
                {t('dashboard.forecast.commits', { count: String(projectedMonthEndTotal) })}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-lg bg-gray-50 dark:bg-[#111] border border-black/5 dark:border-[rgba(255,255,255,0.05)]"
            >
              <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] mb-2">
                <span className="text-xs font-medium">
                  {t('dashboard.forecast.projected_year')}
                </span>
                <Sparkles size={14} className="text-amber-500 dark:text-amber-400" />
              </div>
              <div className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">
                {t('dashboard.forecast.commits', { count: String(projectedYearEndTotal) })}
              </div>
            </motion.div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Consistency card */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#111] border border-black/5 dark:border-[rgba(255,255,255,0.05)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-[#A1A1AA]">
                  {t('dashboard.forecast.consistency_rating')}
                </span>
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                  {t(`dashboard.forecast.consistency_level.${consistencyLevel}`)}
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${consistencyScore}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="bg-zinc-600 dark:bg-zinc-300 h-full rounded-full"
                />
              </div>
              <div className="flex justify-between items-center mt-2 text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
                <span>{consistencyScore}% active days</span>
              </div>
            </div>

            {/* Trend card */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#111] border border-black/5 dark:border-[rgba(255,255,255,0.05)] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-500 dark:text-[#A1A1AA] block mb-1">
                  {t('dashboard.forecast.trend_direction')}
                </span>
                <span className={`text-sm font-bold ${getTrendColorClass()}`}>
                  {t(`dashboard.forecast.trends.${trendType}`)}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] block mt-1">
                  {t('dashboard.forecast.growth_rate', { rate: slope.toFixed(4) })}
                </span>
              </div>
              <div className="p-2 rounded-full bg-black/5 dark:bg-white/5">{getTrendIcon()}</div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
