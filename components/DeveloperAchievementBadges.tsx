'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Star,
  Trophy,
  GitPullRequest,
  Code2,
  TrendingUp,
  Award,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import type { CompareUserData } from '@/app/compare/CompareClient';

export interface DeveloperAchievementBadgesProps {
  user1: CompareUserData;
  user2: CompareUserData;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  border: string;
  shadow: string;
  text: string;
  badgeBg: string;
  winner: 'user1' | 'user2' | 'tie' | 'none';
  winnerUsername?: string;
  winnerAvatar?: string;
  metricLabel: string;
  user1Val: number;
  user2Val: number;
  tooltipText: string;
}

export function computeAchievementBadges(
  user1: CompareUserData,
  user2: CompareUserData
): BadgeDefinition[] {
  const u1Name = user1.profile.username;
  const u2Name = user2.profile.username;

  // 1. Streak Master
  const streak1 = Math.max(user1.stats.currentStreak || 0, user1.stats.peakStreak || 0);
  const streak2 = Math.max(user2.stats.currentStreak || 0, user2.stats.peakStreak || 0);
  let streakWinner: 'user1' | 'user2' | 'tie' | 'none' = 'none';
  if (streak1 > 0 || streak2 > 0) {
    if (streak1 > streak2) streakWinner = 'user1';
    else if (streak2 > streak1) streakWinner = 'user2';
    else streakWinner = 'tie';
  }

  // 2. Community Favorite (Stars)
  const stars1 = user1.profile.stats.stars || 0;
  const stars2 = user2.profile.stats.stars || 0;
  let starsWinner: 'user1' | 'user2' | 'tie' | 'none' = 'none';
  if (stars1 > 0 || stars2 > 0) {
    if (stars1 > stars2) starsWinner = 'user1';
    else if (stars2 > stars1) starsWinner = 'user2';
    else starsWinner = 'tie';
  }

  // 3. Top Contributor
  const contrib1 = user1.stats.totalContributions || 0;
  const contrib2 = user2.stats.totalContributions || 0;
  let contribWinner: 'user1' | 'user2' | 'tie' | 'none' = 'none';
  if (contrib1 > 0 || contrib2 > 0) {
    if (contrib1 > contrib2) contribWinner = 'user1';
    else if (contrib2 > contrib1) contribWinner = 'user2';
    else contribWinner = 'tie';
  }

  // 4. Collaboration Expert (PRs + Issues)
  const collab1 = (user1.stats.totalPRs || 0) + (user1.stats.totalIssues || 0);
  const collab2 = (user2.stats.totalPRs || 0) + (user2.stats.totalIssues || 0);
  let collabWinner: 'user1' | 'user2' | 'tie' | 'none' = 'none';
  if (collab1 > 0 || collab2 > 0) {
    if (collab1 > collab2) collabWinner = 'user1';
    else if (collab2 > collab1) collabWinner = 'user2';
    else collabWinner = 'tie';
  }

  // 5. Polyglot Developer (Languages count)
  const lang1 = user1.languages?.length || 0;
  const lang2 = user2.languages?.length || 0;
  let langWinner: 'user1' | 'user2' | 'tie' | 'none' = 'none';
  if (lang1 > 0 || lang2 > 0) {
    if (lang1 > lang2) langWinner = 'user1';
    else if (lang2 > lang1) langWinner = 'user2';
    else langWinner = 'tie';
  }

  // 6. Rising Developer (Recent activity in last 30 days)
  const recentAct1 = (user1.activity || []).slice(-30).reduce((acc, d) => acc + (d.count || 0), 0);
  const recentAct2 = (user2.activity || []).slice(-30).reduce((acc, d) => acc + (d.count || 0), 0);
  let risingWinner: 'user1' | 'user2' | 'tie' | 'none' = 'none';
  if (recentAct1 > 0 || recentAct2 > 0) {
    if (recentAct1 > recentAct2) risingWinner = 'user1';
    else if (recentAct2 > recentAct1) risingWinner = 'user2';
    else risingWinner = 'tie';
  }

  const getWinnerInfo = (winner: 'user1' | 'user2' | 'tie' | 'none') => {
    if (winner === 'user1') {
      return { winnerUsername: u1Name, winnerAvatar: user1.profile.avatarUrl };
    }
    if (winner === 'user2') {
      return { winnerUsername: u2Name, winnerAvatar: user2.profile.avatarUrl };
    }
    if (winner === 'tie') {
      return { winnerUsername: 'Tie (Both Developers)', winnerAvatar: undefined };
    }
    return { winnerUsername: undefined, winnerAvatar: undefined };
  };

  const getTooltip = (
    title: string,
    winner: 'user1' | 'user2' | 'tie' | 'none',
    val1: number,
    val2: number,
    unit: string
  ) => {
    if (winner === 'user1') {
      return `@${u1Name} won ${title} with ${val1.toLocaleString()} ${unit} (vs @${u2Name}'s ${val2.toLocaleString()} ${unit}).`;
    }
    if (winner === 'user2') {
      return `@${u2Name} won ${title} with ${val2.toLocaleString()} ${unit} (vs @${u1Name}'s ${val1.toLocaleString()} ${unit}).`;
    }
    if (winner === 'tie') {
      return `Both developers tied for ${title} with ${val1.toLocaleString()} ${unit}.`;
    }
    return `No achievement recorded yet for ${title}.`;
  };

  return [
    {
      id: 'streak-master',
      title: 'Streak Master',
      category: 'Consistency',
      description: 'Highest contribution streak achieved',
      icon: Flame,
      color: 'from-amber-500 to-orange-600',
      border: 'border-amber-500/30',
      shadow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]',
      text: 'text-amber-500 dark:text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      winner: streakWinner,
      ...getWinnerInfo(streakWinner),
      metricLabel: 'Peak Streak',
      user1Val: streak1,
      user2Val: streak2,
      tooltipText: getTooltip('Streak Master', streakWinner, streak1, streak2, 'days streak'),
    },
    {
      id: 'community-favorite',
      title: 'Community Favorite',
      category: 'Popularity',
      description: 'Most total stars received across repositories',
      icon: Star,
      color: 'from-yellow-400 to-amber-500',
      border: 'border-yellow-500/30',
      shadow: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.25)]',
      text: 'text-yellow-500 dark:text-yellow-400',
      badgeBg: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      winner: starsWinner,
      ...getWinnerInfo(starsWinner),
      metricLabel: 'Total Stars',
      user1Val: stars1,
      user2Val: stars2,
      tooltipText: getTooltip('Community Favorite', starsWinner, stars1, stars2, 'stars'),
    },
    {
      id: 'top-contributor',
      title: 'Top Contributor',
      category: 'Impact',
      description: 'Highest overall contribution count',
      icon: Trophy,
      color: 'from-purple-500 to-indigo-600',
      border: 'border-purple-500/30',
      shadow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]',
      text: 'text-purple-500 dark:text-purple-400',
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      winner: contribWinner,
      ...getWinnerInfo(contribWinner),
      metricLabel: 'Contributions',
      user1Val: contrib1,
      user2Val: contrib2,
      tooltipText: getTooltip(
        'Top Contributor',
        contribWinner,
        contrib1,
        contrib2,
        'contributions'
      ),
    },
    {
      id: 'collaboration-expert',
      title: 'Collaboration Expert',
      category: 'Teamwork',
      description: 'Most pull requests and issues opened',
      icon: GitPullRequest,
      color: 'from-blue-500 to-cyan-500',
      border: 'border-blue-500/30',
      shadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]',
      text: 'text-blue-500 dark:text-blue-400',
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      winner: collabWinner,
      ...getWinnerInfo(collabWinner),
      metricLabel: 'PRs & Issues',
      user1Val: collab1,
      user2Val: collab2,
      tooltipText: getTooltip(
        'Collaboration Expert',
        collabWinner,
        collab1,
        collab2,
        'PRs and issues'
      ),
    },
    {
      id: 'polyglot-developer',
      title: 'Polyglot Developer',
      category: 'Versatility',
      description: 'Uses the highest number of programming languages',
      icon: Code2,
      color: 'from-violet-500 to-pink-500',
      border: 'border-violet-500/30',
      shadow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]',
      text: 'text-violet-500 dark:text-violet-400',
      badgeBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      winner: langWinner,
      ...getWinnerInfo(langWinner),
      metricLabel: 'Languages',
      user1Val: lang1,
      user2Val: lang2,
      tooltipText: getTooltip('Polyglot Developer', langWinner, lang1, lang2, 'languages'),
    },
    {
      id: 'rising-developer',
      title: 'Rising Developer',
      category: 'Momentum',
      description: 'Fastest growth & highest activity in recent 30 days',
      icon: TrendingUp,
      color: 'from-emerald-400 to-teal-500',
      border: 'border-emerald-500/30',
      shadow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]',
      text: 'text-emerald-500 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      winner: risingWinner,
      ...getWinnerInfo(risingWinner),
      metricLabel: 'Recent Act.',
      user1Val: recentAct1,
      user2Val: recentAct2,
      tooltipText: getTooltip(
        'Rising Developer',
        risingWinner,
        recentAct1,
        recentAct2,
        'recent commits'
      ),
    },
  ];
}

export default function DeveloperAchievementBadges({
  user1,
  user2,
}: DeveloperAchievementBadgesProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'user1' | 'user2'>('all');
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  const badges = computeAchievementBadges(user1, user2);

  const filteredBadges = badges.filter((b) => {
    if (activeFilter === 'user1') return b.winner === 'user1' || b.winner === 'tie';
    if (activeFilter === 'user2') return b.winner === 'user2' || b.winner === 'tie';
    return true;
  });

  const u1Name = user1.profile.username;
  const u2Name = user2.profile.username;

  const u1BadgesCount = badges.filter((b) => b.winner === 'user1' || b.winner === 'tie').length;
  const u2BadgesCount = badges.filter((b) => b.winner === 'user2' || b.winner === 'tie').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs text-[#A1A1AA] uppercase tracking-widest font-medium flex items-center gap-2">
            <Award size={14} className="text-emerald-500" />
            Developer Achievement Badges
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Dynamic awards earned based on head-to-head performance metrics.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#111] border border-black/5 dark:border-[rgba(255,255,255,0.06)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-white dark:bg-[#222] text-gray-900 dark:text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All ({badges.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('user1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilter === 'user1'
                ? 'bg-white dark:bg-[#222] text-gray-900 dark:text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>@{u1Name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
              {u1BadgesCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('user2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilter === 'user2'
                ? 'bg-white dark:bg-[#222] text-gray-900 dark:text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>@{u2Name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/10 text-cyan-500 font-bold">
              {u2BadgesCount}
            </span>
          </button>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredBadges.map((badge) => {
            const Icon = badge.icon;
            const isWinnerUser1 = badge.winner === 'user1';
            const isWinnerUser2 = badge.winner === 'user2';
            const isTie = badge.winner === 'tie';
            const isNone = badge.winner === 'none';

            return (
              <motion.div
                key={badge.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.25 }}
                onMouseEnter={() => setHoveredBadge(badge.id)}
                onMouseLeave={() => setHoveredBadge(null)}
                className={`relative group overflow-hidden p-5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] transition-all duration-300 ${badge.shadow}`}
              >
                {/* Subtle top accent gradient */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${badge.color} opacity-80`}
                />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${badge.badgeBg}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                        {badge.category}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        {badge.title}
                      </h3>
                    </div>
                  </div>

                  {/* Winner Pill */}
                  <div className="flex items-center">
                    {isWinnerUser1 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={10} /> @{u1Name}
                      </span>
                    )}
                    {isWinnerUser2 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        <CheckCircle2 size={10} /> @{u2Name}
                      </span>
                    )}
                    {isTie && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Sparkles size={10} /> Tie
                      </span>
                    )}
                    {isNone && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
                        <Lock size={10} /> Locked
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-[#A1A1AA] mb-4 leading-relaxed line-clamp-2">
                  {badge.description}
                </p>

                {/* Head to Head metrics bar */}
                <div className="pt-3 border-t border-black/5 dark:border-[rgba(255,255,255,0.06)] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A1A1AA] font-medium">{badge.metricLabel}</span>
                    <div className="flex items-center gap-2 font-mono font-semibold text-xs">
                      <span
                        className={
                          isWinnerUser1
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'text-gray-700 dark:text-gray-300'
                        }
                      >
                        @{u1Name}: {badge.user1Val.toLocaleString()}
                      </span>
                      <span className="text-[#A1A1AA]">vs</span>
                      <span
                        className={
                          isWinnerUser2
                            ? 'text-cyan-600 dark:text-cyan-400 font-bold'
                            : 'text-gray-700 dark:text-gray-300'
                        }
                      >
                        @{u2Name}: {badge.user2Val.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Tooltip on Hover */}
                <AnimatePresence>
                  {hoveredBadge === badge.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="mt-3 p-2.5 rounded-xl bg-gray-900 text-white dark:bg-zinc-800 text-[11px] leading-snug flex items-start gap-2 shadow-lg border border-white/10"
                    >
                      <HelpCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{badge.tooltipText}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
