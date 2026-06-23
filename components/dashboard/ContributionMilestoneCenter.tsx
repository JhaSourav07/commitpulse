'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/TranslationContext';
import {
  Trophy,
  Target,
  TrendingUp,
  Star,
  GitCommit,
  Award,
  CheckCircle2,
  Circle,
  Zap,
  Flame,
} from 'lucide-react';

interface MilestoneProps {
  totalContributions: number;
  currentStreak: number;
  peakStreak: number;
  repositories: number;
  stars: number;
  followers: number;
  activity: Array<{ date: string; count: number }>;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  threshold: number;
  current: number;
  category: 'commits' | 'streak' | 'repos' | 'stars' | 'social';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

const tierColors = {
  bronze: {
    bg: 'from-amber-700/20 to-orange-600/20',
    border: 'border-amber-600/30',
    text: 'text-amber-500',
    glow: 'shadow-amber-500/20',
  },
  silver: {
    bg: 'from-slate-400/20 to-gray-300/20',
    border: 'border-slate-400/30',
    text: 'text-slate-400',
    glow: 'shadow-slate-400/20',
  },
  gold: {
    bg: 'from-yellow-500/20 to-amber-400/20',
    border: 'border-yellow-500/30',
    text: 'text-yellow-500',
    glow: 'shadow-yellow-500/20',
  },
  platinum: {
    bg: 'from-cyan-400/20 to-teal-300/20',
    border: 'border-cyan-400/30',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-400/20',
  },
  diamond: {
    bg: 'from-purple-400/20 to-pink-400/20',
    border: 'border-purple-400/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-400/20',
  },
};

function generateMilestones(props: MilestoneProps): Milestone[] {
  const milestones: Milestone[] = [];

  // Commit milestones
  const commitThresholds = [
    {
      threshold: 100,
      tier: 'bronze' as const,
      title: 'First Century',
      desc: 'Reach 100 contributions',
    },
    {
      threshold: 500,
      tier: 'silver' as const,
      title: 'Steady Builder',
      desc: 'Reach 500 contributions',
    },
    {
      threshold: 1000,
      tier: 'gold' as const,
      title: 'Thousand Club',
      desc: 'Reach 1,000 contributions',
    },
    {
      threshold: 5000,
      tier: 'platinum' as const,
      title: 'Code Titan',
      desc: 'Reach 5,000 contributions',
    },
    {
      threshold: 10000,
      tier: 'diamond' as const,
      title: 'Legend Status',
      desc: 'Reach 10,000 contributions',
    },
  ];

  commitThresholds.forEach((ct) => {
    milestones.push({
      id: `commits-${ct.threshold}`,
      title: ct.title,
      description: ct.desc,
      icon: <GitCommit size={18} />,
      threshold: ct.threshold,
      current: props.totalContributions,
      category: 'commits',
      tier: ct.tier,
    });
  });

  // Streak milestones
  const streakThresholds = [
    {
      threshold: 7,
      tier: 'bronze' as const,
      title: 'Week Warrior',
      desc: '7-day contribution streak',
    },
    {
      threshold: 30,
      tier: 'silver' as const,
      title: 'Monthly Machine',
      desc: '30-day contribution streak',
    },
    {
      threshold: 100,
      tier: 'gold' as const,
      title: 'Century Streak',
      desc: '100-day contribution streak',
    },
    {
      threshold: 365,
      tier: 'diamond' as const,
      title: 'Year of Code',
      desc: '365-day contribution streak',
    },
  ];

  streakThresholds.forEach((st) => {
    milestones.push({
      id: `streak-${st.threshold}`,
      title: st.title,
      description: st.desc,
      icon: <Flame size={18} />,
      threshold: st.threshold,
      current: props.peakStreak,
      category: 'streak',
      tier: st.tier,
    });
  });

  // Repository milestones
  const repoThresholds = [
    { threshold: 5, tier: 'bronze' as const, title: 'Repo Starter', desc: 'Create 5 repositories' },
    {
      threshold: 20,
      tier: 'silver' as const,
      title: 'Project Builder',
      desc: 'Create 20 repositories',
    },
    {
      threshold: 50,
      tier: 'gold' as const,
      title: 'Prolific Creator',
      desc: 'Create 50 repositories',
    },
    {
      threshold: 100,
      tier: 'platinum' as const,
      title: 'Repo Master',
      desc: 'Create 100 repositories',
    },
  ];

  repoThresholds.forEach((rt) => {
    milestones.push({
      id: `repos-${rt.threshold}`,
      title: rt.title,
      description: rt.desc,
      icon: <Target size={18} />,
      threshold: rt.threshold,
      current: props.repositories,
      category: 'repos',
      tier: rt.tier,
    });
  });

  // Star milestones
  const starThresholds = [
    { threshold: 10, tier: 'bronze' as const, title: 'Rising Star', desc: 'Earn 10 stars' },
    { threshold: 50, tier: 'silver' as const, title: 'Star Collector', desc: 'Earn 50 stars' },
    { threshold: 100, tier: 'gold' as const, title: 'Star Magnet', desc: 'Earn 100 stars' },
    { threshold: 500, tier: 'platinum' as const, title: 'Stellar', desc: 'Earn 500 stars' },
    { threshold: 1000, tier: 'diamond' as const, title: 'Supernova', desc: 'Earn 1,000 stars' },
  ];

  starThresholds.forEach((st) => {
    milestones.push({
      id: `stars-${st.threshold}`,
      title: st.title,
      description: st.desc,
      icon: <Star size={18} />,
      threshold: st.threshold,
      current: props.stars,
      category: 'stars',
      tier: st.tier,
    });
  });

  // Follower milestones
  const followerThresholds = [
    { threshold: 10, tier: 'bronze' as const, title: 'Community Seed', desc: 'Gain 10 followers' },
    { threshold: 50, tier: 'silver' as const, title: 'Growing Network', desc: 'Gain 50 followers' },
    { threshold: 100, tier: 'gold' as const, title: 'Influencer', desc: 'Gain 100 followers' },
    {
      threshold: 500,
      tier: 'platinum' as const,
      title: 'Thought Leader',
      desc: 'Gain 500 followers',
    },
  ];

  followerThresholds.forEach((ft) => {
    milestones.push({
      id: `social-${ft.threshold}`,
      title: ft.title,
      description: ft.desc,
      icon: <Award size={18} />,
      threshold: ft.threshold,
      current: props.followers,
      category: 'social',
      tier: ft.tier,
    });
  });

  return milestones;
}

export default function ContributionMilestoneCenter({
  totalContributions,
  currentStreak,
  peakStreak,
  repositories,
  stars,
  followers,
  activity,
}: MilestoneProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { t } = useTranslation();

  const milestones = useMemo(
    () =>
      generateMilestones({
        totalContributions,
        currentStreak,
        peakStreak,
        repositories,
        stars,
        followers,
        activity,
      }),
    [totalContributions, currentStreak, peakStreak, repositories, stars, followers, activity]
  );

  const achievedMilestones = useMemo(
    () => milestones.filter((m) => m.current >= m.threshold),
    [milestones]
  );

  const inProgressMilestones = useMemo(
    () => milestones.filter((m) => m.current < m.threshold),
    [milestones]
  );

  const filteredAchieved = useMemo(
    () =>
      activeFilter === 'all'
        ? achievedMilestones
        : achievedMilestones.filter((m) => m.category === activeFilter),
    [activeFilter, achievedMilestones]
  );

  const filteredInProgress = useMemo(
    () =>
      activeFilter === 'all'
        ? inProgressMilestones
        : inProgressMilestones.filter((m) => m.category === activeFilter),
    [activeFilter, inProgressMilestones]
  );

  const completionRate =
    milestones.length > 0 ? Math.round((achievedMilestones.length / milestones.length) * 100) : 0;

  // Find the closest milestone to completion
  const nextMilestone = useMemo(() => {
    if (inProgressMilestones.length === 0) return null;
    return inProgressMilestones.reduce((closest, m) => {
      const closestProgress = closest.current / closest.threshold;
      const mProgress = m.current / m.threshold;
      return mProgress > closestProgress ? m : closest;
    });
  }, [inProgressMilestones]);

  const filters = ['all', 'commits', 'streak', 'repos', 'stars', 'social'];

  const categoryLabels: Record<string, string> = {
    all: t('dashboard.milestones.allFilter') || 'All',
    commits: t('dashboard.milestones.contributions') || 'Contributions',
    streak: t('dashboard.milestones.streak') || 'Streak',
    repos: t('dashboard.milestones.repos') || 'Repositories',
    stars: t('dashboard.milestones.stars') || 'Stars',
    social: t('dashboard.milestones.community') || 'Community',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-black/10 bg-white/80 backdrop-blur-xl p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(17,17,17,0.8)]"
      role="region"
      aria-label="Contribution Milestone Center"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
            <Trophy className="text-amber-500" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black dark:text-white">
              {t('dashboard.milestones.title') || 'Milestone Center'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/50">
              {t('dashboard.milestones.description', {
                achieved: String(achievedMilestones.length),
                total: String(milestones.length),
              }) || `${achievedMilestones.length} of ${milestones.length} milestones achieved`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-2xl font-bold text-amber-500">{completionRate}%</span>
            <p className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-wider">
              {t('dashboard.milestones.complete') || 'Complete'}
            </p>
          </div>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
          />
        </div>
      </div>

      {/* Next Milestone Spotlight */}
      {nextMilestone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-6 p-4 rounded-xl bg-gradient-to-r ${tierColors[nextMilestone.tier].bg} border ${tierColors[nextMilestone.tier].border}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
              {t('dashboard.milestones.nextMilestone') || 'Next Milestone'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={tierColors[nextMilestone.tier].text}>{nextMilestone.icon}</span>
              <div>
                <p className="font-semibold text-black dark:text-white text-sm">
                  {nextMilestone.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-white/50">
                  {nextMilestone.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-black dark:text-white">
                {nextMilestone.current} / {nextMilestone.threshold}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-white/40">
                {Math.round((nextMilestone.current / nextMilestone.threshold) * 100)}% there
              </p>
            </div>
          </div>
          <div className="mt-3 w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min((nextMilestone.current / nextMilestone.threshold) * 100, 100)}%`,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500`}
            />
          </div>
        </motion.div>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeFilter === filter
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-white/50 hover:bg-black/10 dark:hover:bg-white/10 border border-transparent'
            }`}
          >
            {categoryLabels[filter]}
          </button>
        ))}
      </div>

      {/* Achieved Milestones */}
      {filteredAchieved.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <h4 className="text-sm font-semibold text-black dark:text-white">
              {t('dashboard.milestones.achieved') || 'Achieved'}
            </h4>
            <span className="text-xs text-gray-500 dark:text-white/40">
              ({filteredAchieved.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredAchieved.map((milestone, i) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3 rounded-xl bg-gradient-to-r ${tierColors[milestone.tier].bg} border ${tierColors[milestone.tier].border} ${tierColors[milestone.tier].glow} shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 ${tierColors[milestone.tier].text}`}
                    >
                      {milestone.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-black dark:text-white truncate">
                        {milestone.title}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-white/50 truncate">
                        {milestone.description}
                      </p>
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* In Progress Milestones */}
      {filteredInProgress.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-blue-500" />
            <h4 className="text-sm font-semibold text-black dark:text-white">
              {t('dashboard.milestones.inProgress') || 'In Progress'}
            </h4>
            <span className="text-xs text-gray-500 dark:text-white/40">
              ({filteredInProgress.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredInProgress.map((milestone, i) => {
                const progress = Math.min((milestone.current / milestone.threshold) * 100, 100);
                return (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 ${tierColors[milestone.tier].text}`}
                      >
                        {milestone.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-black dark:text-white truncate">
                          {milestone.title}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-white/50 truncate">
                          {milestone.current} / {milestone.threshold}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-white/40 flex-shrink-0">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/5 h-1 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAchieved.length === 0 && filteredInProgress.length === 0 && (
        <div className="text-center py-8">
          <Circle size={32} className="mx-auto text-gray-300 dark:text-white/20 mb-3" />
          <p className="text-sm text-gray-500 dark:text-white/50">
            {t('dashboard.milestones.noMilestones') || 'No milestones in this category'}
          </p>
        </div>
      )}
    </motion.div>
  );
}
