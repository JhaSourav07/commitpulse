'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Trophy,
  Flame,
  Sparkles,
  Star,
  GitFork,
  GitCommit,
  MapPin,
  Calendar,
  Check,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type {
  UserProfile,
  UserStats,
  LanguageData,
  ActivityData,
  Achievement,
  Repository,
} from '@/types/dashboard';

// Types for the comparison component input
export interface CompareUser {
  profile: UserProfile;
  stats: UserStats;
  languages: LanguageData[];
  activity: ActivityData[];
  achievements: Achievement[];
  popularRepos?: Repository[];
}

interface ProfileComparisonAnalyticsProps {
  user1: CompareUser;
  user2: CompareUser;
}

export default function ProfileComparisonAnalytics({
  user1,
  user2,
}: ProfileComparisonAnalyticsProps) {
  const { t } = useTranslation();

  // Safely fallback for User 1
  const u1Profile = useMemo(
    () =>
      user1?.profile || {
        username: 'user1',
        name: 'User One',
        avatarUrl: '',
        isPro: false,
        bio: '',
        location: '',
        joinedDate: '',
        developerScore: 0,
        stats: { repositories: 0, followers: 0, following: 0, stars: 0 },
      },
    [user1]
  );

  const u1Stats = useMemo(
    () => user1?.stats || { currentStreak: 0, peakStreak: 0, totalContributions: 0 },
    [user1]
  );
  const u1Languages = useMemo(() => user1?.languages || [], [user1]);
  const u1Activity = useMemo(() => user1?.activity || [], [user1]);
  const u1Achievements = useMemo(() => user1?.achievements || [], [user1]);
  const u1Repos = useMemo(() => user1?.popularRepos || [], [user1]);

  // Safely fallback for User 2
  const u2Profile = useMemo(
    () =>
      user2?.profile || {
        username: 'user2',
        name: 'User Two',
        avatarUrl: '',
        isPro: false,
        bio: '',
        location: '',
        joinedDate: '',
        developerScore: 0,
        stats: { repositories: 0, followers: 0, following: 0, stars: 0 },
      },
    [user2]
  );

  const u2Stats = useMemo(
    () => user2?.stats || { currentStreak: 0, peakStreak: 0, totalContributions: 0 },
    [user2]
  );
  const u2Languages = useMemo(() => user2?.languages || [], [user2]);
  const u2Activity = useMemo(() => user2?.activity || [], [user2]);
  const u2Achievements = useMemo(() => user2?.achievements || [], [user2]);
  const u2Repos = useMemo(() => user2?.popularRepos || [], [user2]);

  // State for toggling achievement lists
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  // 1. Process Activity month-by-month
  const monthlyData = useMemo(() => {
    const monthlyMap: Record<string, { user1: number; user2: number }> = {};

    const processAct = (act: ActivityData[], key: 'user1' | 'user2') => {
      if (!Array.isArray(act)) return;
      act.forEach((item) => {
        if (!item.date) return;
        const parts = item.date.split('-');
        if (parts.length < 2) return;
        const year = parts[0];
        const month = parts[1];
        const monthYear = `${year}-${month}`;
        if (!monthlyMap[monthYear]) {
          monthlyMap[monthYear] = { user1: 0, user2: 0 };
        }
        monthlyMap[monthYear][key] += item.count || 0;
      });
    };

    processAct(u1Activity, 'user1');
    processAct(u2Activity, 'user2');

    const monthNames = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
    ];

    return Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthYear, counts]) => {
        const [year, monthStr] = monthYear.split('-');
        const monthIdx = parseInt(monthStr, 10) - 1;
        const monthKey = monthNames[monthIdx] || monthStr;
        const localizedMonthName = t(`dashboard.compare.months.${monthKey}`, {
          defaultValue: monthKey.toUpperCase(),
        });
        return {
          label: `${localizedMonthName} ${year}`,
          ...counts,
        };
      });
  }, [u1Activity, u2Activity, t]);

  const maxMonthlyVal = useMemo(() => {
    if (monthlyData.length === 0) return 1;
    const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.user1, d.user2)), 0);
    return maxVal === 0 ? 1 : maxVal;
  }, [monthlyData]);

  // 2. Process Languages side-by-side
  const combinedLanguages = useMemo(() => {
    const allLangs: Record<
      string,
      { name: string; color: string; user1Pct: number; user2Pct: number }
    > = {};

    u1Languages.forEach((l) => {
      if (!l.name) return;
      allLangs[l.name] = {
        name: l.name,
        color: l.color || '#94a3b8',
        user1Pct: typeof l.percentage === 'number' && !isNaN(l.percentage) ? l.percentage : 0,
        user2Pct: 0,
      };
    });

    u2Languages.forEach((l) => {
      if (!l.name) return;
      if (allLangs[l.name]) {
        allLangs[l.name].user2Pct =
          typeof l.percentage === 'number' && !isNaN(l.percentage) ? l.percentage : 0;
      } else {
        allLangs[l.name] = {
          name: l.name,
          color: l.color || '#94a3b8',
          user1Pct: 0,
          user2Pct: typeof l.percentage === 'number' && !isNaN(l.percentage) ? l.percentage : 0,
        };
      }
    });

    return Object.values(allLangs).sort(
      (a, b) => b.user1Pct + b.user2Pct - (a.user1Pct + a.user2Pct)
    );
  }, [u1Languages, u2Languages]);

  // 3. Process Achievements comparison
  const mergedAchievements = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        title: string;
        description: string;
        type: Achievement['type'];
        user1: Achievement | null;
        user2: Achievement | null;
      }
    > = {};

    u1Achievements.forEach((a) => {
      if (!a.id) return;
      map[a.id] = {
        id: a.id,
        title: a.title || 'Achievement',
        description: a.description || '',
        type: a.type || 'contributions',
        user1: a,
        user2: null,
      };
    });

    u2Achievements.forEach((a) => {
      if (!a.id) return;
      if (map[a.id]) {
        map[a.id].user2 = a;
      } else {
        map[a.id] = {
          id: a.id,
          title: a.title || 'Achievement',
          description: a.description || '',
          type: a.type || 'contributions',
          user1: null,
          user2: a,
        };
      }
    });

    return Object.values(map);
  }, [u1Achievements, u2Achievements]);

  const visibleAchievements = showAllAchievements
    ? mergedAchievements
    : mergedAchievements.slice(0, 4);

  // 4. Process and Rank Top 3 Repositories
  const processTopRepos = (repos: Repository[]) => {
    if (!Array.isArray(repos)) return [];
    return repos
      .map((repo) => {
        const repoObj = repo as unknown as Record<string, unknown>;
        const commits = (repoObj.commits ?? repoObj.commitCount ?? 0) as number;
        const stars = repo.stargazerCount ?? ((repoObj.stars ?? 0) as number);
        const forks = repo.forkCount ?? ((repoObj.forks ?? 0) as number);

        // Impact Score: (commits * 3) + (stars * 5) + (forks * 10)
        const score = commits * 3 + stars * 5 + forks * 10;

        let langName = 'Unknown';
        let langColor = '#94a3b8';
        if (repo.primaryLanguage) {
          langName = repo.primaryLanguage.name || 'Unknown';
          langColor = repo.primaryLanguage.color || '#94a3b8';
        }

        return {
          name: repo.name || 'unnamed-repo',
          description: repo.description || '',
          commits,
          stars,
          forks,
          score,
          url: repo.url || '#',
          language: { name: langName, color: langColor },
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  const u1TopRepos = useMemo(() => processTopRepos(u1Repos), [u1Repos]);
  const u2TopRepos = useMemo(() => processTopRepos(u2Repos), [u2Repos]);

  // Symmetrical layout requires rendering indices 0, 1, 2 head-to-head
  const maxRepoRank = 3;

  return (
    <div className="space-y-8 w-full" role="region" aria-label={t('dashboard.compare.title')}>
      {/* Header section with profile cards & VS floating circle */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Floating VS middle divider */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-12 h-12 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a] font-extrabold text-sm shadow-md text-zinc-500 dark:text-zinc-400 select-none pointer-events-none"
          aria-hidden="true"
        >
          {t('dashboard.compare.vs')}
        </div>

        {/* User 1 profile card */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden"
        >
          {u1Profile.isPro && (
            <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider">
              {t('dashboard.profile.pro')}
            </div>
          )}

          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-black/10 dark:border-[rgba(255,255,255,0.12)]">
                {u1Profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      u1Profile.avatarUrl.startsWith('http')
                        ? `${u1Profile.avatarUrl}${u1Profile.avatarUrl.includes('?') ? '&' : '?'}s=120`
                        : u1Profile.avatarUrl
                    }
                    alt={u1Profile.name || 'User One Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-lg">
                    {u1Profile.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {u1Profile.name || u1Profile.username}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">@{u1Profile.username}</p>

                <div className="mt-2 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md w-fit">
                  <Award size={13} />
                  <span className="text-[10px] font-bold tracking-wide uppercase">
                    {t('dashboard.compare.developer_score')}: {u1Profile.developerScore}
                  </span>
                </div>
              </div>
            </div>

            {u1Profile.bio && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
                {u1Profile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-zinc-500 dark:text-[#A1A1AA] mb-6">
              {u1Profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {u1Profile.location}
                </span>
              )}
              {u1Profile.joinedDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {u1Profile.joinedDate}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-black/5 dark:border-white/5 pt-4">
            <div className="text-center">
              <span className="block text-xs font-semibold text-gray-900 dark:text-white">
                {u1Profile.stats?.repositories || 0}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
                {t('dashboard.profile.repos')}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-xs font-semibold text-gray-900 dark:text-white">
                {u1Profile.stats?.followers || 0}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
                {t('dashboard.profile.followers')}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-xs font-semibold text-gray-900 dark:text-white">
                {u1Stats.totalContributions || 0}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
                {t('dashboard.stats.contributions')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* User 2 profile card */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden"
        >
          {u2Profile.isPro && (
            <div className="absolute top-4 right-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider">
              {t('dashboard.profile.pro')}
            </div>
          )}

          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-black/10 dark:border-[rgba(255,255,255,0.12)]">
                {u2Profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      u2Profile.avatarUrl.startsWith('http')
                        ? `${u2Profile.avatarUrl}${u2Profile.avatarUrl.includes('?') ? '&' : '?'}s=120`
                        : u2Profile.avatarUrl
                    }
                    alt={u2Profile.name || 'User Two Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-lg">
                    {u2Profile.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {u2Profile.name || u2Profile.username}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">@{u2Profile.username}</p>

                <div className="mt-2 flex items-center gap-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md w-fit">
                  <Award size={13} />
                  <span className="text-[10px] font-bold tracking-wide uppercase">
                    {t('dashboard.compare.developer_score')}: {u2Profile.developerScore}
                  </span>
                </div>
              </div>
            </div>

            {u2Profile.bio && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
                {u2Profile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-zinc-500 dark:text-[#A1A1AA] mb-6">
              {u2Profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {u2Profile.location}
                </span>
              )}
              {u2Profile.joinedDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {u2Profile.joinedDate}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-black/5 dark:border-white/5 pt-4">
            <div className="text-center">
              <span className="block text-xs font-semibold text-gray-900 dark:text-white">
                {u2Profile.stats?.repositories || 0}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
                {t('dashboard.profile.repos')}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-xs font-semibold text-gray-900 dark:text-white">
                {u2Profile.stats?.followers || 0}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
                {t('dashboard.profile.followers')}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-xs font-semibold text-gray-900 dark:text-white">
                {u2Stats.totalContributions || 0}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
                {t('dashboard.stats.contributions')}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Contribution Comparison Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]"
      >
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            {t('dashboard.compare.contribution_comparison.title')}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
            {t('dashboard.compare.contribution_comparison.subtitle')}
          </p>
        </div>

        {monthlyData.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 dark:text-[#A1A1AA]">
            {t('dashboard.compare.contribution_comparison.no_data')}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Visual Bar Chart */}
            <div
              className="relative h-64 border-b border-black/10 dark:border-white/10 pb-2 overflow-x-auto scrollbar-thin flex items-end gap-6 md:justify-around w-full"
              role="img"
              aria-label="Activity comparison chart"
            >
              {monthlyData.map((data, idx) => {
                const u1Pct = (data.user1 / maxMonthlyVal) * 100;
                const u2Pct = (data.user2 / maxMonthlyVal) * 100;

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center min-w-[50px] group relative h-full justify-end"
                  >
                    {/* Hover Stats Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black dark:bg-white text-white dark:text-black text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-20">
                      <p className="font-semibold">{data.label}</p>
                      <p className="text-emerald-500">
                        @{u1Profile.username}: {data.user1}
                      </p>
                      <p className="text-indigo-500">
                        @{u2Profile.username}: {data.user2}
                      </p>
                    </div>

                    {/* The double bar */}
                    <div className="flex items-end gap-1.5 h-48 w-full justify-center">
                      {/* User 1 bar (emerald) */}
                      <div className="w-3 bg-zinc-100 dark:bg-zinc-900/50 rounded-t h-full flex items-end overflow-hidden">
                        <div
                          className="w-full bg-emerald-500 rounded-t transition-all duration-500"
                          style={{ height: `${u1Pct}%` }}
                        />
                      </div>

                      {/* User 2 bar (indigo) */}
                      <div className="w-3 bg-zinc-100 dark:bg-zinc-900/50 rounded-t h-full flex items-end overflow-hidden">
                        <div
                          className="w-full bg-indigo-500 rounded-t transition-all duration-500"
                          style={{ height: `${u2Pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Month label */}
                    <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] mt-2 block font-medium">
                      {data.label.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick legend with totals */}
            <div className="flex flex-wrap justify-between items-center gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block" />
                  {t('dashboard.compare.contribution_comparison.user_total', {
                    name: `@${u1Profile.username}`,
                    count: u1Stats.totalContributions.toLocaleString(),
                  })}
                </span>
                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm inline-block" />
                  {t('dashboard.compare.contribution_comparison.user_total', {
                    name: `@${u2Profile.username}`,
                    count: u2Stats.totalContributions.toLocaleString(),
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Language Breakdown Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]"
      >
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            {t('dashboard.compare.language_comparison.title')}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
            {t('dashboard.compare.language_comparison.subtitle')}
          </p>
        </div>

        {combinedLanguages.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 dark:text-[#A1A1AA]">
            {t('dashboard.compare.language_comparison.no_data')}
          </div>
        ) : (
          <div className="space-y-4">
            {combinedLanguages.map((lang) => (
              <div
                key={lang.name}
                className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center py-2 border-b border-black/5 dark:border-white/5 last:border-0"
              >
                {/* User 1 language percentage */}
                <div className="flex items-center justify-end gap-3 text-right">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {lang.user1Pct.toFixed(1)}%
                  </span>
                  <div className="w-20 md:w-32 h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden flex justify-end">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${lang.user1Pct}%` }}
                    />
                  </div>
                </div>

                {/* Center language badge */}
                <div className="flex items-center justify-center gap-1.5 px-3 min-w-[90px] text-center">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: lang.color }}
                  />
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    {lang.name}
                  </span>
                </div>

                {/* User 2 language percentage */}
                <div className="flex items-center justify-start gap-3 text-left">
                  <div className="w-20 md:w-32 h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${lang.user2Pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {lang.user2Pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Achievement Comparison Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]"
      >
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('dashboard.compare.achievement_comparison.title')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              {t('dashboard.compare.achievement_comparison.subtitle')}
            </p>
          </div>
        </div>

        {mergedAchievements.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 dark:text-[#A1A1AA]">
            {t('dashboard.compare.achievement_comparison.no_data')}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center font-bold text-[10px] text-[#A1A1AA] uppercase tracking-wider pb-2 border-b border-black/10 dark:border-white/10">
              <span>@{u1Profile.username}</span>
              <span className="text-center">{t('dashboard.achievements.title')}</span>
              <span className="text-right">@{u2Profile.username}</span>
            </div>

            <div className="divide-y divide-black/5 dark:divide-white/5 space-y-2">
              {visibleAchievements.map((item) => {
                const isUnlocked1 = item.user1?.isUnlocked || false;
                const isUnlocked2 = item.user2?.isUnlocked || false;

                // Let's decide how to display who unlocked it
                let unlockedBy = t('dashboard.compare.achievement_comparison.neither');
                if (isUnlocked1 && isUnlocked2) {
                  unlockedBy = t('dashboard.compare.achievement_comparison.both');
                } else if (isUnlocked1) {
                  unlockedBy = `@${u1Profile.username}`;
                } else if (isUnlocked2) {
                  unlockedBy = `@${u2Profile.username}`;
                }

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[auto_1fr_auto] gap-4 items-center py-4"
                  >
                    {/* User 1 Badge */}
                    <div>
                      {isUnlocked1 ? (
                        <div
                          className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md"
                          role="img"
                          aria-label={`${u1Profile.username} unlocked ${item.title}`}
                        >
                          <Check size={11} />
                          <span>{t('dashboard.compare.achievement_comparison.unlocked')}</span>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1 text-[10px] font-bold bg-zinc-500/5 text-zinc-400 border border-zinc-500/10 px-2 py-1 rounded-md opacity-40"
                          role="img"
                          aria-label={`${u1Profile.username} locked ${item.title}`}
                        >
                          <Lock size={11} />
                          <span>{t('dashboard.compare.achievement_comparison.locked')}</span>
                        </div>
                      )}
                    </div>

                    {/* Achievement Details */}
                    <div className="text-center px-4">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        {item.type === 'streak' ? (
                          <Flame size={14} className="text-amber-500" />
                        ) : item.type === 'behavior' ? (
                          <Sparkles size={14} className="text-blue-500" />
                        ) : (
                          <Trophy size={14} className="text-yellow-500" />
                        )}
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] leading-tight mb-1 max-w-sm mx-auto">
                        {item.description}
                      </p>
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-[#777] uppercase tracking-wider">
                        {t('dashboard.compare.achievement_comparison.unlocked_by')}: {unlockedBy}
                      </span>
                    </div>

                    {/* User 2 Badge */}
                    <div className="text-right">
                      {isUnlocked2 ? (
                        <div
                          className="flex items-center gap-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-md"
                          role="img"
                          aria-label={`${u2Profile.username} unlocked ${item.title}`}
                        >
                          <Check size={11} />
                          <span>{t('dashboard.compare.achievement_comparison.unlocked')}</span>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1 text-[10px] font-bold bg-zinc-500/5 text-zinc-400 border border-zinc-500/10 px-2 py-1 rounded-md opacity-40"
                          role="img"
                          aria-label={`${u2Profile.username} locked ${item.title}`}
                        >
                          <Lock size={11} />
                          <span>{t('dashboard.compare.achievement_comparison.locked')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {mergedAchievements.length > 4 && (
              <button
                onClick={() => setShowAllAchievements(!showAllAchievements)}
                className="mt-2 w-full flex items-center justify-center gap-1 border border-black/10 dark:border-white/10 rounded-lg py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                {showAllAchievements ? (
                  <>
                    <span>{t('dashboard.achievements.show_less')}</span>
                    <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    <span>{t('dashboard.achievements.see_all')}</span>
                    <ChevronDown size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Repository Comparison Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]"
      >
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            {t('dashboard.compare.repository_comparison.title')}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
            {t('dashboard.compare.repository_comparison.subtitle')}
          </p>
        </div>

        {u1TopRepos.length === 0 && u2TopRepos.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 dark:text-[#A1A1AA]">
            {t('dashboard.compare.repository_comparison.no_data')}
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from({ length: maxRepoRank }).map((_, rankIdx) => {
              const repo1 = u1TopRepos[rankIdx];
              const repo2 = u2TopRepos[rankIdx];

              // If neither has a repository at this rank, don't render it
              if (!repo1 && !repo2) return null;

              // Highlighting winners for individual stats
              const scoreWinner =
                repo1 && repo2
                  ? repo1.score > repo2.score
                    ? 'user1'
                    : repo1.score < repo2.score
                      ? 'user2'
                      : 'tie'
                  : null;
              const commitsWinner =
                repo1 && repo2
                  ? repo1.commits > repo2.commits
                    ? 'user1'
                    : repo1.commits < repo2.commits
                      ? 'user2'
                      : 'tie'
                  : null;
              const starsWinner =
                repo1 && repo2
                  ? repo1.stars > repo2.stars
                    ? 'user1'
                    : repo1.stars < repo2.stars
                      ? 'user2'
                      : 'tie'
                  : null;
              const forksWinner =
                repo1 && repo2
                  ? repo1.forks > repo2.forks
                    ? 'user1'
                    : repo1.forks < repo2.forks
                      ? 'user2'
                      : 'tie'
                  : null;

              return (
                <div
                  key={rankIdx}
                  className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center relative"
                >
                  {/* Repo 1 details (Left) */}
                  <div className="space-y-3">
                    {repo1 ? (
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {repo1.name}
                          </h4>
                          {repo1.language.name !== 'Unknown' && (
                            <span
                              className="text-[9px] font-bold border px-1.5 py-0.5 rounded-full inline-flex items-center gap-1"
                              style={{
                                color: repo1.language.color,
                                borderColor: `${repo1.language.color}33`,
                                backgroundColor: `${repo1.language.color}11`,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full inline-block"
                                style={{ backgroundColor: repo1.language.color }}
                              />
                              {repo1.language.name}
                            </span>
                          )}
                          <a
                            href={repo1.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                            aria-label={`View ${repo1.name} repository on GitHub`}
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        {repo1.description && (
                          <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] line-clamp-2 mt-1 leading-relaxed">
                            {repo1.description}
                          </p>
                        )}

                        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-black/5 dark:border-white/5 text-center">
                          <div>
                            <span className="text-[10px] text-[#A1A1AA] block">
                              {t('dashboard.compare.repository_comparison.commits')}
                            </span>
                            <span
                              className={`text-[11px] font-bold ${commitsWinner === 'user1' ? 'text-emerald-500 font-extrabold' : 'text-gray-700 dark:text-zinc-300'}`}
                            >
                              {repo1.commits}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#A1A1AA] block">
                              {t('dashboard.compare.repository_comparison.stars')}
                            </span>
                            <span
                              className={`text-[11px] font-bold ${starsWinner === 'user1' ? 'text-emerald-500 font-extrabold' : 'text-gray-700 dark:text-zinc-300'}`}
                            >
                              {repo1.stars}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#A1A1AA] block">
                              {t('dashboard.compare.repository_comparison.forks')}
                            </span>
                            <span
                              className={`text-[11px] font-bold ${forksWinner === 'user1' ? 'text-emerald-500 font-extrabold' : 'text-gray-700 dark:text-zinc-300'}`}
                            >
                              {repo1.forks}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#A1A1AA] block">
                              {t('dashboard.compare.repository_comparison.impact_score')}
                            </span>
                            <span
                              className={`text-[11px] font-extrabold ${scoreWinner === 'user1' ? 'text-emerald-500' : 'text-zinc-800 dark:text-zinc-200'}`}
                            >
                              {repo1.score}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-zinc-400 dark:text-zinc-600">
                        N/A
                      </div>
                    )}
                  </div>

                  {/* Central Rank Indicator */}
                  <div className="flex flex-col items-center justify-center min-w-[70px] py-2 md:py-0 border-y md:border-y-0 md:border-x border-black/5 dark:border-white/5 select-none">
                    <span className="text-[9px] text-[#A1A1AA] uppercase tracking-wider font-bold">
                      {t('dashboard.compare.repository_comparison.rank')}
                    </span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      #{rankIdx + 1}
                    </span>
                  </div>

                  {/* Repo 2 details (Right) */}
                  <div className="space-y-3">
                    {repo2 ? (
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-start md:justify-end md:text-right">
                          <a
                            href={repo2.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none md:order-last"
                            aria-label={`View ${repo2.name} repository on GitHub`}
                          >
                            <ExternalLink size={12} />
                          </a>
                          {repo2.language.name !== 'Unknown' && (
                            <span
                              className="text-[9px] font-bold border px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 md:order-2"
                              style={{
                                color: repo2.language.color,
                                borderColor: `${repo2.language.color}33`,
                                backgroundColor: `${repo2.language.color}11`,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full inline-block"
                                style={{ backgroundColor: repo2.language.color }}
                              />
                              {repo2.language.name}
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate md:order-1">
                            {repo2.name}
                          </h4>
                        </div>
                        {repo2.description && (
                          <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] line-clamp-2 mt-1 leading-relaxed md:text-right">
                            {repo2.description}
                          </p>
                        )}

                        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-black/5 dark:border-white/5 text-center">
                          <div>
                            <span className="text-[10px] text-[#A1A1AA] block">
                              {t('dashboard.compare.repository_comparison.commits')}
                            </span>
                            <span
                              className={`text-[11px] font-bold ${commitsWinner === 'user2' ? 'text-indigo-500 font-extrabold' : 'text-gray-700 dark:text-zinc-300'}`}
                            >
                              {repo2.commits}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#A1A1AA] block">
                              {t('dashboard.compare.repository_comparison.stars')}
                            </span>
                            <span
                              className={`text-[11px] font-bold ${starsWinner === 'user2' ? 'text-indigo-500 font-extrabold' : 'text-gray-700 dark:text-zinc-300'}`}
                            >
                              {repo2.stars}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#A1A1AA] block">
                              {t('dashboard.compare.repository_comparison.forks')}
                            </span>
                            <span
                              className={`text-[11px] font-bold ${forksWinner === 'user2' ? 'text-indigo-500 font-extrabold' : 'text-gray-700 dark:text-zinc-300'}`}
                            >
                              {repo2.forks}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#A1A1AA] block">
                              {t('dashboard.compare.repository_comparison.impact_score')}
                            </span>
                            <span
                              className={`text-[11px] font-extrabold ${scoreWinner === 'user2' ? 'text-indigo-500' : 'text-zinc-800 dark:text-zinc-200'}`}
                            >
                              {repo2.score}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-zinc-400 dark:text-zinc-600">
                        N/A
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
