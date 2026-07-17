'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCommit,
  Trophy,
  Sparkles,
  Calendar,
  Award,
  Flame,
  Clock,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { Achievement } from '@/types/dashboard';

interface DeveloperJourneyTimelineProps {
  activity: Array<{ date: string; count: number; intensity: number }>;
  achievements?: Achievement[];
}

export interface TimelineEvent {
  id: string;
  type:
    | 'first_commit'
    | 'peak_day'
    | 'milestone_50'
    | 'milestone_100'
    | 'milestone_500'
    | 'milestone_1000'
    | 'achievement';
  title: string;
  description: string;
  date: string;
  value?: number;
  iconType: 'commit' | 'peak' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'achievement';
}

export default function DeveloperJourneyTimeline({
  activity = [],
  achievements = [],
}: DeveloperJourneyTimelineProps) {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<'all' | 'milestones' | 'achievements'>('all');

  // Compute chronological landmark events
  const timelineEvents = useMemo(() => {
    if (!activity || activity.length === 0) return [];

    const sortedActivity = [...activity].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const events: TimelineEvent[] = [];
    const milestonesCrossed = {
      50: false,
      100: false,
      500: false,
      1000: false,
    };

    // 1. First Commit Landmark
    const firstCommitEntry = sortedActivity.find((a) => a.count > 0);
    if (firstCommitEntry) {
      events.push({
        id: 'first_commit',
        type: 'first_commit',
        title: t('dashboard.journey.firstCommit') || 'First Commit',
        description:
          t('dashboard.journey.firstCommitDesc', { date: firstCommitEntry.date }) ||
          `Journey began with the first commit on ${firstCommitEntry.date}`,
        date: firstCommitEntry.date,
        value: firstCommitEntry.count,
        iconType: 'commit',
      });
    }

    // 2. Peak Day Landmark
    let peakEntry = sortedActivity[0];
    for (const entry of sortedActivity) {
      if (entry.count > (peakEntry?.count || 0)) {
        peakEntry = entry;
      }
    }
    if (peakEntry && peakEntry.count > 0) {
      events.push({
        id: 'peak_day',
        type: 'peak_day',
        title: t('dashboard.journey.peakDay') || 'Peak Day',
        description:
          t('dashboard.journey.peakDayDesc', {
            count: String(peakEntry.count),
            date: peakEntry.date,
          }) || `Highest daily contribution of ${peakEntry.count} commits on ${peakEntry.date}`,
        date: peakEntry.date,
        value: peakEntry.count,
        iconType: 'peak',
      });
    }

    // 3. Growth Milestones (Total Contributions Threshold Crossings)
    let runningTotal = 0;
    for (const entry of sortedActivity) {
      runningTotal += entry.count;
      for (const threshold of [50, 100, 500, 1000] as const) {
        if (runningTotal >= threshold && !milestonesCrossed[threshold]) {
          milestonesCrossed[threshold] = true;

          let title = '';
          let desc = '';
          let iconType: TimelineEvent['iconType'] = 'bronze';

          if (threshold === 50) {
            title = t('dashboard.journey.milestone50') || 'Bronze Contributor';
            desc =
              t('dashboard.journey.milestone50Desc', { date: entry.date }) ||
              `Reached 50 total contributions on ${entry.date}`;
            iconType = 'bronze';
          } else if (threshold === 100) {
            title = t('dashboard.journey.milestone100') || 'Silver Contributor';
            desc =
              t('dashboard.journey.milestone100Desc', { date: entry.date }) ||
              `Reached 100 total contributions on ${entry.date}`;
            iconType = 'silver';
          } else if (threshold === 500) {
            title = t('dashboard.journey.milestone500') || 'Gold Contributor';
            desc =
              t('dashboard.journey.milestone500Desc', { date: entry.date }) ||
              `Reached 500 total contributions on ${entry.date}`;
            iconType = 'gold';
          } else if (threshold === 1000) {
            title = t('dashboard.journey.milestone1000') || 'Diamond Contributor';
            desc =
              t('dashboard.journey.milestone1000Desc', { date: entry.date }) ||
              `Reached 1,000 total contributions on ${entry.date}`;
            iconType = 'diamond';
          }

          events.push({
            id: `milestone_${threshold}`,
            type: `milestone_${threshold}` as TimelineEvent['type'],
            title,
            description: desc,
            date: entry.date,
            value: runningTotal,
            iconType,
          });
        }
      }
    }

    // 4. Achievements Landmarks
    if (achievements && achievements.length > 0) {
      achievements.forEach((ach) => {
        if (ach.isUnlocked) {
          let achDate: string | undefined;

          // Estimate date when this achievement was unlocked based on type & threshold
          if (ach.type === 'contributions') {
            let currentSum = 0;
            const crossing = sortedActivity.find((entry) => {
              currentSum += entry.count;
              return currentSum >= ach.threshold;
            });
            if (crossing) {
              achDate = crossing.date;
            }
          }

          // Fallback to first commit date if no date could be calculated
          if (!achDate && firstCommitEntry) {
            achDate = firstCommitEntry.date;
          }

          if (achDate) {
            events.push({
              id: `achievement_${ach.id}`,
              type: 'achievement',
              title: ach.title,
              description: ach.description,
              date: achDate,
              iconType: 'achievement',
            });
          }
        }
      });
    }

    // Sort all events chronologically (earliest to latest)
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activity, achievements, t]);

  // Filter events based on active selection
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return timelineEvents;
    if (filterType === 'milestones') {
      return timelineEvents.filter((e) => e.type !== 'achievement');
    }
    if (filterType === 'achievements') {
      return timelineEvents.filter((e) => e.type === 'achievement');
    }
    return timelineEvents;
  }, [timelineEvents, filterType]);

  if (!activity || activity.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] shadow-sm text-center">
        <Clock size={32} className="mx-auto mb-3 text-zinc-400 dark:text-zinc-600" />
        <p className="text-zinc-600 dark:text-[#A1A1AA] text-sm">
          {t('dashboard.journey.noActivity') || 'No activity recorded yet for this journey'}
        </p>
      </div>
    );
  }

  // Get the appropriate icon and color scheme for each landmark type
  const getEventStyle = (iconType: TimelineEvent['iconType']) => {
    switch (iconType) {
      case 'commit':
        return {
          icon: <GitCommit size={16} />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
        };
      case 'peak':
        return {
          icon: <Flame size={16} />,
          bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
        };
      case 'bronze':
        return {
          icon: <Award size={16} />,
          bg: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50',
        };
      case 'silver':
        return {
          icon: <Award size={16} />,
          bg: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
        };
      case 'gold':
        return {
          icon: <Trophy size={16} />,
          bg: 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30',
        };
      case 'diamond':
        return {
          icon: <Sparkles size={16} />,
          bg: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50',
        };
      case 'achievement':
        return {
          icon: <CheckCircle2 size={16} />,
          bg: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
        };
      default:
        return {
          icon: <Bookmark size={16} />,
          bg: 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800',
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] shadow-sm"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-black/5 dark:border-[rgba(255,255,255,0.04)] pb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <Clock size={16} className="text-zinc-500 dark:text-[#A1A1AA]" />
            {t('dashboard.journey.title') || 'Developer Journey Timeline'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
            {t('dashboard.journey.subtitle') || 'Visualize complete developer evolution history'}
          </p>
        </div>

        {/* Filter Toolbar (Milestone Explorer navigation) */}
        <div
          className="flex items-center gap-1.5 self-start sm:self-center"
          role="toolbar"
          aria-label={t('dashboard.journey.explore') || 'Explore Timeline'}
        >
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
            aria-pressed={filterType === 'all'}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('milestones')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === 'milestones'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
            aria-pressed={filterType === 'milestones'}
          >
            Milestones
          </button>
          <button
            onClick={() => setFilterType('achievements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === 'achievements'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
            aria-pressed={filterType === 'achievements'}
          >
            Achievements
          </button>
        </div>
      </div>

      {/* Timeline Layout */}
      <div className="relative pl-6 sm:pl-8 mt-4">
        {/* Continuous vertical timeline connector line */}
        <div className="absolute left-3 sm:left-4 top-1.5 bottom-1.5 w-0.5 bg-gradient-to-b from-zinc-200 via-zinc-200 to-zinc-100 dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-900/20" />

        <div className="flex flex-col gap-6" role="list">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, index) => {
              const style = getEventStyle(event.iconType);
              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="relative group"
                  role="listitem"
                >
                  {/* Event bullet point / icon container */}
                  <div
                    className={`absolute -left-[30px] sm:-left-[35px] top-1.5 w-7 h-7 rounded-full flex items-center justify-center border bg-white dark:bg-[#0a0a0a] shadow-sm z-10 ${style.bg}`}
                  >
                    {style.icon}
                  </div>

                  {/* Growth card contents */}
                  <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-[#0f0f10] border border-black/[0.04] dark:border-[rgba(255,255,255,0.03)] hover:border-black/10 dark:hover:border-[rgba(255,255,255,0.08)] transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">
                          {event.iconType === 'achievement'
                            ? 'Achievement Unlocked'
                            : 'Milestone achieved'}
                        </span>
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {event.title}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1.5 leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      {/* Date details */}
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 font-medium mt-0.5">
                        <Calendar size={11} />
                        <span>{event.date}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredEvents.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-600">
                No events match the selected filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
