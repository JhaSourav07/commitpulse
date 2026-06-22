'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  GitFork,
  Star,
  Award,
  TrendingUp,
  Shield,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { Repository } from '@/types/dashboard';

interface OpenSourceImpactScoreProps {
  repositories?: Repository[];
  totalContributions?: number;
}

export default function OpenSourceImpactScore({
  repositories = [],
  totalContributions = 0,
}: OpenSourceImpactScoreProps) {
  const { t } = useTranslation();

  // 1. Calculate aggregated statistics
  const stats = useMemo(() => {
    const totalStars = repositories.reduce((sum, r) => sum + r.stargazerCount, 0);
    const totalForks = repositories.reduce((sum, r) => sum + r.forkCount, 0);
    const repoCount = repositories.length;

    // Aggregate Influence Score calculation: normalized footprint out of 100
    // Uses log scale to reward early growth but challenge high scaling
    const starsFactor = Math.log10(totalStars + 1) * 35;
    const forksFactor = Math.log10(totalForks + 1) * 25;
    const contribsFactor = Math.min(40, (totalContributions || 0) * 0.05);
    const rawScore = starsFactor + forksFactor + contribsFactor;
    const influenceScore = Math.min(100, Math.max(12, Math.round(rawScore))); // Base rank of 12

    // Determine impact tier / rank
    let rank = 'Bronze Builder';
    let rankColor = 'text-orange-500';
    if (influenceScore > 85) {
      rank = 'Elite Maintainer';
      rankColor = 'text-cyan-400';
    } else if (influenceScore > 65) {
      rank = 'Gold Contributor';
      rankColor = 'text-yellow-500';
    } else if (influenceScore > 40) {
      rank = 'Silver Builder';
      rankColor = 'text-slate-400';
    }

    return {
      totalStars,
      totalForks,
      repoCount,
      influenceScore,
      rank,
      rankColor,
    };
  }, [repositories, totalContributions]);

  // 2. Individual repository rankings based on weighted impact score
  // Formula: (commits * 3) + (stars * 5) + (forks * 10) -> since we don't have commits per repo,
  // we proxy with (stars * 5) + (forks * 10) + 15
  const topRepos = useMemo(() => {
    return repositories
      .map((repo) => {
        const impactScore = repo.stargazerCount * 5 + repo.forkCount * 10 + 15;
        return {
          ...repo,
          impactScore,
        };
      })
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 5);
  }, [repositories]);

  if (repositories.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] shadow-sm text-center">
        <Globe size={32} className="mx-auto mb-3 text-zinc-400 dark:text-zinc-600" />
        <p className="text-zinc-600 dark:text-[#A1A1AA] text-sm">
          {t('dashboard.openSourceImpact.noData') || 'No open source impact data available'}
        </p>
      </div>
    );
  }

  // Draw circular indicator segment math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.influenceScore / 100) * circumference;

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
            <Globe size={16} className="text-zinc-500 dark:text-[#A1A1AA]" />
            {t('dashboard.openSourceImpact.title') || 'Open Source Impact Score'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
            {t('dashboard.openSourceImpact.subtitle') ||
              'Measure overall community contribution impact and influence footprint'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Influence Gauge Column */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50/50 dark:bg-[#0f0f10] border border-black/[0.04] dark:border-[rgba(255,255,255,0.03)] text-center">
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
            {t('dashboard.openSourceImpact.influenceScore') || 'Influence Score'}
          </span>

          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* SVG circle meter */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-zinc-100 dark:stroke-zinc-800"
                strokeWidth="7"
                fill="transparent"
              />
              <motion.circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-zinc-900 dark:stroke-zinc-100"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                {stats.influenceScore}
              </span>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500">/ 100</span>
            </div>
          </div>

          <div className="mt-4">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
              {t('dashboard.openSourceImpact.rank') || 'Global Impact Rank'}
            </span>
            <span className={`text-xs font-bold ${stats.rankColor} mt-0.5 block`}>
              {stats.rank}
            </span>
          </div>
        </div>

        {/* Community Metrics and Breakdown */}
        <div className="md:col-span-8 flex flex-col gap-5 justify-between">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-black/5 dark:border-[rgba(255,255,255,0.03)]">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-[#A1A1AA] text-xs font-medium">
                <Star size={14} className="text-yellow-500" />
                <span>{t('dashboard.openSourceImpact.stars') || 'Stars'}</span>
              </div>
              <span className="text-lg font-bold text-zinc-900 dark:text-white mt-1.5 block">
                {stats.totalStars}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-black/5 dark:border-[rgba(255,255,255,0.03)]">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-[#A1A1AA] text-xs font-medium">
                <GitFork size={14} className="text-cyan-500" />
                <span>{t('dashboard.openSourceImpact.forks') || 'Forks'}</span>
              </div>
              <span className="text-lg font-bold text-zinc-900 dark:text-white mt-1.5 block">
                {stats.totalForks}
              </span>
            </div>
          </div>

          {/* Top Repos list by Weighted Impact */}
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5 block">
              Top Impact Repositories
            </span>
            <div className="flex flex-col gap-2">
              {topRepos.map((repo) => (
                <div
                  key={repo.name}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-50/30 dark:bg-zinc-900/30 border border-black/[0.02] dark:border-white/[0.01]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: repo.primaryLanguage?.color || '#a1a1aa' }}
                    />
                    <span className="font-medium text-zinc-900 dark:text-zinc-200 truncate">
                      {repo.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                    Score: {repo.impactScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
