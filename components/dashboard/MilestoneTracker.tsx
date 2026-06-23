'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/context/TranslationContext';
import { Trophy, Target } from 'lucide-react';

interface MilestoneTrackerProps {
  totalContributions: number;
  currentStreak: number;
}

export default function MilestoneTracker({
  totalContributions,
  currentStreak,
}: MilestoneTrackerProps) {
  const { t } = useTranslation();

  // Define milestones dynamically based on current achievements
  const contributionMilestone =
    totalContributions >= 1000
      ? 5000
      : totalContributions >= 500
        ? 1000
        : totalContributions >= 100
          ? 500
          : 100;
  const streakMilestone = currentStreak >= 30 ? 100 : currentStreak >= 7 ? 30 : 7;

  const contributionPct = Math.min(
    100,
    Math.round((totalContributions / contributionMilestone) * 100)
  );
  const streakPct = Math.min(100, Math.round((currentStreak / streakMilestone) * 100));

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
        {t('dashboard.achievement_center.progress') || 'Milestone Progress'}
      </h4>

      <div className="space-y-4">
        {/* Contributions Milestone */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-black/5 dark:border-white/5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-amber-500" />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Commits Milestone</span>
            </div>
            <span className="font-mono text-zinc-600 dark:text-zinc-400">
              {totalContributions}/{contributionMilestone} ({contributionPct}%)
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${contributionPct}%` }}
              transition={{ duration: 0.6 }}
              className="bg-amber-500 h-full rounded-full"
            />
          </div>
        </div>

        {/* Streak Milestone */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-black/5 dark:border-white/5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-rose-500" />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Streak Milestone</span>
            </div>
            <span className="font-mono text-zinc-600 dark:text-zinc-400">
              {currentStreak}/{streakMilestone} ({streakPct}%)
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${streakPct}%` }}
              transition={{ duration: 0.6 }}
              className="bg-rose-500 h-full rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
