'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Zap,
  Clock,
  DollarSign,
  Brain,
  Layers,
  Copy,
  Check,
  TrendingUp,
  Share2,
  Code2,
} from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import {
  calculateRealWorldImpact,
  type RepositoryData,
  type ActivityData,
} from '@/services/github/impact-calculator';
import RepositoryImpactAnalyzer from './RepositoryImpactAnalyzer';

export interface ValueImpactDashboardProps {
  repositories?: RepositoryData[];
  activityData?: ActivityData;
  onOpenRepoReel?: () => void;
}

export default function ValueImpactDashboard({
  repositories = [],
  activityData = {},
  onOpenRepoReel,
}: ValueImpactDashboardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const metrics = calculateRealWorldImpact(repositories, activityData);

  const handleCopyPitch = async () => {
    try {
      const pitchText = `${metrics.recruiterSummary.oneLiner}\n\nKey Highlights:\n${metrics.recruiterSummary.bulletPoints.map((b) => `• ${b}`).join('\n')}`;
      await navigator.clipboard.writeText(pitchText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.section
      role="region"
      aria-labelledby="value-dashboard-title"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full flex flex-col gap-6"
    >
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-blue-900/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Award className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h2
              id="value-dashboard-title"
              className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2"
            >
              {t('impact_dashboard.title')}
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                {metrics.tier}
              </span>
            </h2>
            <p className="text-xs text-purple-200/70 mt-1">{t('impact_dashboard.subtitle')}</p>
          </div>
        </div>

        {onOpenRepoReel && (
          <button
            type="button"
            onClick={onOpenRepoReel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all duration-200 cursor-pointer active:scale-95"
          >
            <Code2 className="w-4 h-4" />
            {t('reporeel.launch_button')}
          </button>
        )}
      </div>

      {/* Metrics Score Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Real World Impact Score */}
        <div className="p-5 rounded-xl bg-white/60 dark:bg-neutral-900/50 backdrop-blur-md border border-gray-200/60 dark:border-neutral-800/60 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>{t('impact_dashboard.score_title')}</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-white font-mono">
              {metrics.impactScore}
            </span>
            <span className="text-xs text-zinc-400">/ 100</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.impactScore}%` }}
            />
          </div>
        </div>

        {/* Developer Hours Saved */}
        <div className="p-5 rounded-xl bg-white/60 dark:bg-neutral-900/50 backdrop-blur-md border border-gray-200/60 dark:border-neutral-800/60 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>{t('impact_dashboard.hours_title')}</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-zinc-900 dark:text-white font-mono">
              {metrics.hoursSaved.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-400">{t('impact_dashboard.hours_unit')}</span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
            ~${metrics.developerValueDollars.toLocaleString()} {t('impact_dashboard.value_est')}
          </p>
        </div>

        {/* Problem Solving Depth */}
        <div className="p-5 rounded-xl bg-white/60 dark:bg-neutral-900/50 backdrop-blur-md border border-gray-200/60 dark:border-neutral-800/60 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>{t('impact_dashboard.depth_title')}</span>
            <Brain className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-zinc-900 dark:text-white font-mono">
              {metrics.problemSolvingDepth}%
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.problemSolvingDepth}%` }}
            />
          </div>
        </div>

        {/* Architectural Weight */}
        <div className="p-5 rounded-xl bg-white/60 dark:bg-neutral-900/50 backdrop-blur-md border border-gray-200/60 dark:border-neutral-800/60 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>{t('impact_dashboard.arch_title')}</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-zinc-900 dark:text-white font-mono">
              {metrics.architecturalWeight}%
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.architecturalWeight}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recruiter Executive Summary Card */}
      <div className="p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/60 backdrop-blur-lg border border-purple-500/20 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {t('impact_dashboard.recruiter_pitch_title')}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCopyPitch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('impact_dashboard.copied')}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t('impact_dashboard.copy_summary')}</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-neutral-950/60 border border-gray-200/50 dark:border-neutral-800/50">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {metrics.recruiterSummary.oneLiner}
          </p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {metrics.recruiterSummary.bulletPoints.map((point, idx) => (
              <li
                key={idx}
                className="text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-2"
              >
                <span className="text-purple-500 font-bold">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Embedded Repository Impact Analyzer */}
      <RepositoryImpactAnalyzer repositories={repositories} />
    </motion.section>
  );
}
