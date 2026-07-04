'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, CalendarDays, Calendar, GitCommit, Share2 } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import InsightsShareModal from './InsightsShareModal';

export interface ContributionInsightsPanelProps {
  username: string;
  stats: {
    currentStreak: number;
    peakStreak: number;
    totalContributions: number;
  };
  activity: Array<{ date: string; count: number }>;
  periodLabel: string;
}

export default function ContributionInsightsPanel({
  username,
  stats,
  activity,
  periodLabel,
}: ContributionInsightsPanelProps) {
  const { t } = useTranslation();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  let mostActiveWeekday = 'N/A';
  let mostActiveMonth = 'N/A';

  if (activity && activity.length > 0 && stats.totalContributions > 0) {
    const weekdayCounts = new Array(7).fill(0);
    const monthCounts = new Array(12).fill(0);

    activity.forEach((day) => {
      if (day.count > 0) {
        // Appending T00:00:00Z ensures the date is parsed in UTC, matching the day of the activity
        const date = new Date(day.date + 'T00:00:00Z');
        weekdayCounts[date.getUTCDay()] += day.count;
        monthCounts[date.getUTCMonth()] += day.count;
      }
    });

    const maxWeekdayVal = Math.max(...weekdayCounts);
    const maxMonthVal = Math.max(...monthCounts);

    const bestWeekdayIdx = weekdayCounts.indexOf(maxWeekdayVal);
    const bestMonthIdx = monthCounts.indexOf(maxMonthVal);

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
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

    if (maxWeekdayVal > 0) {
      mostActiveWeekday = weekdays[bestWeekdayIdx];
    }
    if (maxMonthVal > 0) {
      mostActiveMonth = months[bestMonthIdx];
    }
  }

  const items = [
    {
      label: 'Current Streak',
      value: stats.totalContributions > 0 ? `${stats.currentStreak} Days` : '0 Days',
      icon: Flame,
      subtext: t('dashboard.stats.utc_disclaimer')
        ? `ℹ ${t('dashboard.stats.utc_disclaimer')}`
        : 'UTC based',
    },
    {
      label: 'Longest Streak',
      value: stats.totalContributions > 0 ? `${stats.peakStreak} Days` : '0 Days',
      icon: TrendingUp,
    },
    {
      label: 'Most Active Day',
      value: mostActiveWeekday,
      icon: CalendarDays,
    },
    {
      label: 'Most Active Month',
      value: mostActiveMonth,
      icon: Calendar,
    },
    {
      label: 'Total Contributions',
      value: stats.totalContributions.toString(),
      icon: GitCommit,
      subtext: periodLabel,
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.14)] hover:shadow-[0_0_24px_rgba(99,102,241,0.08)] transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Flame size={16} className="text-gray-500" />
            Contribution Insights
          </h3>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <Share2 size={14} />
            Share
          </button>
        </div>

        {stats.totalContributions === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <GitCommit size={32} className="text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No contribution data available for this period.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-[rgba(255,255,255,0.06)] group-hover:border-[rgba(99,102,241,0.2)] transition-colors duration-200">
                    <item.icon
                      size={16}
                      className="text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</p>
                    {item.subtext && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.subtext}</p>
                    )}
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white text-right">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <InsightsShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        username={username}
      />
    </>
  );
}
