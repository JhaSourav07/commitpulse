'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, TrendingUp, GitPullRequest, CheckCircle2 } from 'lucide-react';
import type { PRInsightData } from '@/services/github/pr-insights';
import { useTranslation } from '@/context/TranslationContext';

interface PRReviewVelocityProps {
  data: PRInsightData;
}

export default function PRReviewVelocity({ data }: PRReviewVelocityProps) {
  const { t } = useTranslation();

  const avgFirstReview = data?.avgTimeToFirstReview ?? 0;
  const avgCycle = data?.avgCycleTime ?? 0;
  const avgReview = data?.avgReviewTime ?? 0;
  const fastestMergedTime = data?.highlights?.fastestMerged?.time;
  const repos = data?.repoPerformance ?? [];

  const getVelocityBadge = (hours: number) => {
    if (hours <= 0) return { label: 'N/A', color: 'bg-gray-100 dark:bg-zinc-800 text-gray-500' };
    if (hours < 12)
      return {
        label: 'Fast Reviews ⚡',
        color:
          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      };
    if (hours < 24)
      return {
        label: 'Healthy Rhythm',
        color:
          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      };
    if (hours < 48)
      return {
        label: 'Standard Velocity',
        color:
          'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
      };
    return {
      label: 'Needs Attention',
      color:
        'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    };
  };

  const firstReviewBadge = getVelocityBadge(avgFirstReview);

  // Find max review time among repos for relative bar width
  const maxRepoTime = Math.max(1, ...repos.map((r) => r.avgReviewTime || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-3xl p-6 flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="text-cyan-500 w-5 h-5" />
            {t('dashboard.prInsights.velocity_title', {
              defaultValue: 'PR Review Velocity',
            })}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('dashboard.prInsights.velocity_subtitle', {
              defaultValue: 'Review cycle turnaround times and merge velocity breakdown.',
            })}
          </p>
        </div>
        <div
          className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold ${firstReviewBadge.color}`}
        >
          {firstReviewBadge.label}
        </div>
      </div>

      {/* Top 4 Velocity Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-2">
            <Zap size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t('dashboard.prInsights.velocity_first_review', {
                defaultValue: 'Time to 1st Review',
              })}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {avgFirstReview > 0 ? avgFirstReview.toFixed(1) : '0.0'}{' '}
            <span className="text-sm text-gray-500 font-medium">hrs</span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
            <TrendingUp size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t('dashboard.prInsights.cycle_time', {
                defaultValue: 'Total Cycle Time',
              })}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {avgCycle > 0 ? avgCycle.toFixed(1) : '0.0'}{' '}
            <span className="text-sm text-gray-500 font-medium">hrs</span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
            <Clock size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t('dashboard.prInsights.avg_review_time', {
                defaultValue: 'Avg Review Duration',
              })}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {avgReview > 0 ? avgReview.toFixed(1) : '0.0'}{' '}
            <span className="text-sm text-gray-500 font-medium">hrs</span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t('dashboard.prInsights.fastest_merge', {
                defaultValue: 'Fastest Merge',
              })}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {fastestMergedTime ? fastestMergedTime.toFixed(1) : '0.0'}{' '}
            <span className="text-sm text-gray-500 font-medium">hrs</span>
          </div>
        </div>
      </div>

      {/* Repository Review Turnaround Breakdown */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
          {t('dashboard.prInsights.repo_turnaround', {
            defaultValue: 'Average Review Time by Repository',
          })}
        </h3>

        {repos.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl">
            No repository turnaround data available.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {repos.slice(0, 5).map((repo) => {
              const reviewHrs = repo.avgReviewTime || 0;
              const hasReviews = (repo.reviewCount ?? 0) > 0 || reviewHrs > 0;
              const widthPct = hasReviews
                ? Math.min(100, Math.max(8, (reviewHrs / maxRepoTime) * 100))
                : 0;

              return (
                <div
                  key={repo.name}
                  className="bg-gray-50 dark:bg-zinc-800/30 rounded-2xl p-3.5 border border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div
                    className="flex items-center gap-2 min-w-[140px] max-w-[200px] truncate"
                    title={`PR review turnaround for ${repo.name}`}
                  >
                    <GitPullRequest className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {repo.name}
                    </span>
                  </div>

                  <div
                    className="flex-1 max-w-sm w-full mx-auto"
                    title={
                      hasReviews
                        ? `${Math.round((reviewHrs / maxRepoTime) * 100)}% relative to slowest repository review time`
                        : 'No reviews recorded'
                    }
                  >
                    <div className="w-full bg-gray-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 min-w-[120px] text-right">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {repo.reviewCount || 0} reviews
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {hasReviews ? `${reviewHrs.toFixed(1)} hrs` : 'No Reviews'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
