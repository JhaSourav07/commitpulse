'use client';

import { motion } from 'framer-motion';
import { GitFork, Users, GitCommit, RefreshCw, ChevronLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import DownloadReportMenu from './DownloadReportMenu';
import type { BurnoutReport } from '@/services/github/burnout-analyzer';

interface RepoHeaderProps {
  repoName: string;
  totalCommits: number;
  totalContributors: number;
  sustainabilityScore: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  report?: BurnoutReport;
}

export default function RepoHeader({
  repoName,
  totalCommits,
  totalContributors,
  sustainabilityScore,
  onRefresh,
  isRefreshing,
  report,
}: RepoHeaderProps) {
  const [owner, name] = repoName.split('/');

  // Circular gauge parameters
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (sustainabilityScore / 100) * circumference;

  // Sustainability rating
  const getRating = (score: number) => {
    if (score > 80)
      return {
        label: 'Excellent',
        color: 'text-emerald-500 dark:text-emerald-400',
        border: 'border-emerald-500/20 bg-emerald-500/10',
      };
    if (score > 55)
      return {
        label: 'Moderate',
        color: 'text-amber-500 dark:text-amber-400',
        border: 'border-amber-500/20 bg-amber-500/10',
      };
    return {
      label: 'Critical Risk',
      color: 'text-rose-500 dark:text-rose-400',
      border: 'border-rose-500/20 bg-rose-500/10',
    };
  };

  const rating = getRating(sustainabilityScore);

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl shadow-sm">
      <div className="flex flex-col gap-4">
        <Link
          href="/burnout-analyzer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors w-fit"
        >
          <ChevronLeft size={14} />
          Back to Search
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
            <GitFork size={22} className="rotate-90" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
              {name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Owned by{' '}
              <span className="font-semibold text-gray-700 dark:text-zinc-300">@{owner}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-1">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5 text-xs font-medium text-gray-600 dark:text-zinc-300">
            <GitCommit size={14} className="text-zinc-400" />
            <span>{totalCommits.toLocaleString()} Total Commits</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5 text-xs font-medium text-gray-600 dark:text-zinc-300">
            <Users size={14} className="text-zinc-400" />
            <span>{totalContributors} Contributors</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-6 border-t border-black/5 dark:border-white/5 pt-4 md:border-t-0 md:pt-0">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-20 h-20">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-gray-100 dark:stroke-zinc-900 fill-none"
                strokeWidth="7"
              />
              {/* Foreground Indicator */}
              <motion.circle
                cx="40"
                cy="40"
                r={radius}
                className={`fill-none ${
                  sustainabilityScore > 80
                    ? 'stroke-emerald-500'
                    : sustainabilityScore > 55
                      ? 'stroke-amber-500'
                      : 'stroke-rose-500'
                }`}
                strokeWidth="7"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                {sustainabilityScore}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold mt-0.5">
                Score
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Sustainability
            </span>
            <span className={`text-base font-bold ${rating.color}`}>{rating.label}</span>
            <span
              className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${rating.border}`}
            >
              <ShieldAlert size={10} />
              Repository Health
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {report && <DownloadReportMenu report={report} />}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all text-gray-600 dark:text-zinc-300 ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Refresh Analysis"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
