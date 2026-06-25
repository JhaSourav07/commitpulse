'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';
import { useTranslation } from '@/context/TranslationContext';
import AchievementBadge from './AchievementBadge';
import MilestoneTracker from './MilestoneTracker';

interface AchievementCenterProps {
  data: DashboardData;
}

export default function AchievementCenter({ data }: AchievementCenterProps) {
  const { t } = useTranslation();
  const { stats, profile } = data;

  const achievementsList = useMemo(() => {
    const totalCommits = stats.totalContributions || 0;
    const currentStreak = stats.currentStreak || 0;
    const peakStreak = stats.peakStreak || 0;
    const repoCount = profile.stats?.repositories || 0;
    const starCount = profile.stats?.stars || 0;

    return [
      {
        id: 'streak-master',
        title: t('dashboard.achievement_center.streak_master') || 'Streak Master',
        description: 'Maintain a coding streak of 7 days or more.',
        isUnlocked: currentStreak >= 7 || peakStreak >= 7,
        type: 'streak' as const,
      },
      {
        id: 'code-machine',
        title: t('dashboard.achievement_center.code_machine') || 'Code Machine',
        description: 'Accumulate 100 or more total contributions.',
        isUnlocked: totalCommits >= 100,
        type: 'contributions' as const,
      },
      {
        id: 'collaborator',
        title: t('dashboard.achievement_center.collaborator') || 'Core Collaborator',
        description: 'Own or collaborate on 5 or more public repositories.',
        isUnlocked: repoCount >= 5,
        type: 'collaboration' as const,
      },
      {
        id: 'legend',
        title: t('dashboard.achievement_center.legend') || 'Open Source Legend',
        description: 'Amass 200+ commits and receive community recognition.',
        isUnlocked: totalCommits >= 200 && starCount >= 5,
        type: 'legend' as const,
      },
    ];
  }, [stats, profile, t]);

  const unlockedCount = useMemo(() => {
    return achievementsList.filter((a) => a.isUnlocked).length;
  }, [achievementsList]);

  return (
    <motion.div
      data-testid="achievements"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] shadow-sm"
    >
      <div className="flex items-center justify-between mb-5 border-b border-black/5 dark:border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <Trophy size={18} className="text-zinc-500 dark:text-[#A1A1AA]" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              {t('dashboard.achievement_center.title') || 'Open Source Achievement Center'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
              {t('dashboard.achievement_center.subtitle') ||
                'Celebrate milestones and track rewards.'}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
          {unlockedCount}/{achievementsList.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Badges Grid */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3" data-testid="badges-grid">
          {achievementsList.map((badge) => (
            <AchievementBadge
              key={badge.id}
              id={badge.id}
              title={badge.title}
              description={badge.description}
              isUnlocked={badge.isUnlocked}
              type={badge.type}
            />
          ))}
        </div>

        {/* Milestone Progress */}
        <div className="space-y-4">
          <MilestoneTracker
            totalContributions={stats.totalContributions}
            currentStreak={stats.currentStreak}
          />
        </div>
      </div>
    </motion.div>
  );
}
