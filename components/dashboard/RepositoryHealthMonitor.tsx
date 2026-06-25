'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, Archive, CheckCircle, ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { formatAge } from './RepositoryImpactAnalyzer';

export interface RepositoryHealthMonitorProps {
  repositories: Array<{
    name: string;
    commits?: number;
    commitCount?: number;
    stars?: number;
    stargazerCount?: number;
    forks?: number;
    forkCount?: number;
    createdAt?: string | Date;
    created_at?: string | Date;
    language?:
      | {
          name: string;
          color: string;
        }
      | string
      | null;
    primaryLanguage?:
      | {
          name: string;
          color: string;
        }
      | string
      | null;
    url?: string;
  }>;
}

export default function RepositoryHealthMonitor({
  repositories = [],
}: RepositoryHealthMonitorProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'healthy' | 'at_risk' | 'growth'>('all');

  // Sanitize and process repositories for health metrics
  const processedRepos = useMemo(() => {
    return repositories.map((repo) => {
      const commits = repo.commits ?? repo.commitCount ?? 0;
      const stars = repo.stars ?? repo.stargazerCount ?? 0;
      const forks = repo.forks ?? repo.forkCount ?? 0;

      // Resolve Language name and color
      let langName = 'Unknown';
      let langColor = '#94a3b8'; // default slate-400
      const langObj = repo.primaryLanguage ?? repo.language;
      if (langObj) {
        if (typeof langObj === 'object') {
          langName = langObj.name ?? 'Unknown';
          langColor = langObj.color ?? '#94a3b8';
        } else if (typeof langObj === 'string') {
          langName = langObj;
        }
      }

      // Resolve age in months
      const now = new Date();
      const createdRaw = repo.createdAt ?? repo.created_at ?? now;
      const created = new Date(createdRaw);
      const validCreated = isNaN(created.getTime()) ? now : created;
      const diffYears = now.getFullYear() - validCreated.getFullYear();
      const diffMonths = now.getMonth() - validCreated.getMonth();
      const ageInMonths = Math.max(1, diffYears * 12 + diffMonths);

      // Score calculation logic:
      // 1. Commit frequency factor (out of 40): 40 * min(1, commits / 50)
      const commitScore = Math.min(40, (commits / 50) * 40);
      // 2. Stars + forks factor (out of 30): 30 * min(1, (stars + forks) / 100)
      const popularityScore = Math.min(30, ((stars + forks) / 100) * 30);
      // 3. Documentation/Metadata coverage (simulated deterministically between 10% and 30%)
      let nameHash = 0;
      for (let i = 0; i < repo.name.length; i++) {
        nameHash += repo.name.charCodeAt(i);
      }
      const docScore = 10 + (nameHash % 21); // 10 to 30

      const rawScore = Math.round(commitScore + popularityScore + docScore);
      const score = Math.max(10, Math.min(100, rawScore));

      // Grade logic
      let grade = 'F';
      let gradeColor = 'text-red-500 bg-red-500/10 border-red-500/20';
      if (score >= 85) {
        grade = 'A';
        gradeColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      } else if (score >= 70) {
        grade = 'B';
        gradeColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      } else if (score >= 55) {
        grade = 'C';
        gradeColor = 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      } else if (score >= 40) {
        grade = 'D';
        gradeColor = 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      }

      // Signal logic
      let signal = 'stable';
      let signalLabel = t('dashboard.health.signals.stable', { defaultValue: 'Healthy' });
      let signalIcon = CheckCircle;
      let signalColor = 'text-emerald-500';

      const monthlyStars = stars / ageInMonths;
      if (monthlyStars > 5) {
        signal = 'growth';
        signalLabel = t('dashboard.health.signals.growth', { defaultValue: 'High Growth' });
        signalIcon = TrendingUp;
        signalColor = 'text-indigo-500';
      } else if (commits < 5 && ageInMonths > 6) {
        signal = 'at_risk';
        signalLabel = t('dashboard.health.signals.risk', { defaultValue: 'Archive Candidate' });
        signalIcon = Archive;
        signalColor = 'text-amber-500';
      }

      return {
        name: repo.name,
        commits,
        stars,
        forks,
        score,
        grade,
        gradeColor,
        ageInMonths,
        language: {
          name: langName,
          color: langColor,
        },
        signal,
        signalLabel,
        signalIcon,
        signalColor,
        url: repo.url ?? '#',
      };
    });
  }, [repositories, t]);

  // Filter logic
  const filteredRepos = useMemo(() => {
    if (filter === 'all') return processedRepos;
    if (filter === 'healthy')
      return processedRepos.filter((r) => r.grade === 'A' || r.grade === 'B');
    return processedRepos.filter((r) => r.signal === filter);
  }, [processedRepos, filter]);

  if (!repositories || repositories.length === 0) {
    return (
      <motion.div
        role="region"
        aria-labelledby="health-monitor-title"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 rounded-xl bg-white/50 dark:bg-neutral-950/50 backdrop-blur-md border border-gray-200/50 dark:border-neutral-800/50 shadow-md flex flex-col justify-center items-center min-h-[300px]"
      >
        <h3
          id="health-monitor-title"
          className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4"
        >
          <Heart className="w-5 h-5 text-red-500" />
          {t('dashboard.health.title', { defaultValue: 'Repository Health Monitor' })}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
          {t('dashboard.health.no_data', { defaultValue: 'No repository data available.' })}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      role="region"
      aria-labelledby="health-monitor-title"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full p-6 rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-lg border border-gray-200/50 dark:border-neutral-800/50 shadow-xl flex flex-col gap-6"
    >
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/40 dark:border-neutral-800/40 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="health-monitor-title"
              className="text-base font-bold text-zinc-900 dark:text-white"
            >
              {t('dashboard.health.title', { defaultValue: 'Repository Health Monitor' })}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('dashboard.health.subtitle', {
                defaultValue:
                  'Automated health grading and growth analytics for your repositories.',
              })}
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('dashboard.health.filter.all', { defaultValue: 'All' })}
          </button>
          <button
            onClick={() => setFilter('healthy')}
            className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'healthy'
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('dashboard.health.filter.healthy', { defaultValue: 'Healthy (A/B)' })}
          </button>
          <button
            onClick={() => setFilter('growth')}
            className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'growth'
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('dashboard.health.filter.growth', { defaultValue: 'High Growth' })}
          </button>
          <button
            onClick={() => setFilter('at_risk')}
            className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'at_risk'
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('dashboard.health.filter.at_risk', { defaultValue: 'Archive Candidate' })}
          </button>
        </div>
      </div>

      {/* Repositories Health Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/5">
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                {t('dashboard.health.columns.repo', { defaultValue: 'Repository' })}
              </th>
              <th className="text-center py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                {t('dashboard.health.columns.grade', { defaultValue: 'Health Grade' })}
              </th>
              <th className="text-center py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                {t('dashboard.health.columns.score', { defaultValue: 'Score' })}
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                {t('dashboard.health.columns.status', { defaultValue: 'Signal' })}
              </th>
              <th className="text-right py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                {t('dashboard.health.columns.commits', { defaultValue: 'Commits' })}
              </th>
              <th className="text-right py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                {t('dashboard.health.columns.stars', { defaultValue: 'Stars' })}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRepos.map((repo) => {
              const Icon = repo.signalIcon;
              return (
                <tr
                  key={repo.name}
                  className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  {/* Name & Age */}
                  <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1 group"
                    >
                      {repo.name}
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {formatAge(repo.ageInMonths, t)}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">•</span>
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: repo.language.color }}
                        />
                        {repo.language.name}
                      </span>
                    </div>
                  </td>

                  {/* Health Grade */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black border text-sm ${repo.gradeColor}`}
                    >
                      {repo.grade}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="py-3 px-2 text-center font-bold text-gray-700 dark:text-zinc-300 font-mono">
                    {repo.score}
                  </td>

                  {/* Signal */}
                  <td className="py-3 px-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${repo.signalColor}`}
                    >
                      <Icon className="w-4 h-4" />
                      {repo.signalLabel}
                    </span>
                  </td>

                  {/* Commits */}
                  <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400 font-mono">
                    {repo.commits}
                  </td>

                  {/* Stars */}
                  <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400 font-mono">
                    {repo.stars}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
