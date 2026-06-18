'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Flame } from 'lucide-react';
import dynamic from 'next/dynamic';
import RepoHeader from '@/components/burnout/RepoHeader';
import DependencyRiskCard from '@/components/burnout/DependencyRiskCard';
import BurnoutRiskTable from '@/components/burnout/BurnoutRiskTable';
import InactivityDetector from '@/components/burnout/InactivityDetector';
import RecommendationsCard from '@/components/burnout/RecommendationsCard';
import BurnoutRiskAssessmentSection from '@/components/burnout/BurnoutRiskAssessmentSection';
import type { ContributorMetric } from '@/services/github/burnout-analyzer';

const BurnoutChart = dynamic(() => import('@/components/burnout/BurnoutChart'), { ssr: false });

interface InactivityAlert {
  username: string;
  avatarUrl: string;
  previousAvgWeeklyCommits: number;
  weeksSilent: number;
  severity: 'Medium' | 'High';
}

interface BurnoutReport {
  repoName: string;
  totalCommits: number;
  totalContributors: number;
  busFactor: number;
  dependencyRisk: 'Low' | 'Medium' | 'High';
  sustainabilityScore: number;
  contributors: ContributorMetric[];
  inactivityAlerts: InactivityAlert[];
  recommendations: string[];
}

export default function BurnoutAnalyzerPage() {
  const [query, setQuery] = useState('');
  const [report, setReport] = useState<BurnoutReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSearch = async (e?: React.FormEvent, targetRepo?: string) => {
    if (e) e.preventDefault();
    const repoPath = targetRepo || query;
    if (!repoPath.trim() || !repoPath.includes('/')) {
      setError('Please enter a valid repository path in "owner/repo" format.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReport(null);

    const [owner, repo] = repoPath.trim().split('/');

    try {
      const res = await fetch(`/api/repo-burnout?owner=${owner}&repo=${repo}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze repository.');
      }

      setReport(data);
      setQuery(repoPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!report) return;
    setIsRefreshing(true);
    setError(null);

    const [owner, repo] = report.repoName.split('/');

    try {
      const res = await fetch(`/api/repo-burnout?owner=${owner}&repo=${repo}&refresh=true`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to refresh analysis.');
      }

      setReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadSuggestion = (repoPath: string) => {
    setQuery(repoPath);
    handleSearch(undefined, repoPath);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12 min-h-[80vh]">
      <AnimatePresence mode="wait">
        {/* 1. SEARCH/INPUT FORM STATE */}
        {!report && !isLoading && (
          <motion.div
            key="search-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-6">
              <Flame size={12} className="inline mr-1" />
              Burnout & Sustainability Radar
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl md:text-5xl leading-none">
              AI Contributor Burnout Sentinel
            </h1>

            <p className="mt-4 text-base text-gray-500 dark:text-zinc-400 max-w-lg leading-relaxed">
              Evaluate workload sustainability, detect sudden inactivity drops, identify Bus Factor
              dependency risks, and get actionable recommendations for your team.
            </p>

            <form onSubmit={(e) => handleSearch(e)} className="w-full mt-8 relative max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. facebook/react or vercel/next.js"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-11 pr-24 py-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-sm text-gray-900 dark:text-white shadow-sm"
                />
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-semibold text-xs px-4 py-2.5 rounded-xl active:scale-[0.98] shadow-md"
                >
                  Analyze
                </button>
              </div>
            </form>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-xs text-rose-500 font-semibold"
              >
                {error}
              </motion.p>
            )}

            {/* Suggestions list */}
            <div className="mt-12 w-full max-w-md">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-left mb-3">
                Try popular repositories:
              </h3>
              <div className="flex flex-col gap-2">
                {['facebook/react', 'vercel/next.js', 'kashviporwal-byte/commitpulse'].map(
                  (repo) => (
                    <button
                      key={repo}
                      onClick={() => loadSuggestion(repo)}
                      className="flex items-center justify-between p-3 rounded-xl border border-black/5 dark:border-white/5 bg-white/40 dark:bg-zinc-950/40 hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/10 dark:hover:border-white/10 text-xs font-semibold text-gray-700 dark:text-zinc-300 transition-all active:scale-[0.99] text-left"
                    >
                      <span>{repo}</span>
                      <span className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                        Load Demo
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. LOADING STATE SKELETON */}
        {isLoading && (
          <motion.div
            key="loading-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Header skeleton */}
            <div className="h-32 w-full rounded-2xl shimmer" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="h-64 rounded-2xl shimmer" />
              {/* Card 2 */}
              <div className="h-64 rounded-2xl shimmer" />
            </div>

            {/* Table skeleton */}
            <div className="h-96 w-full rounded-2xl shimmer" />
          </motion.div>
        )}

        {/* 3. DASHBOARD VIEW STATE */}
        {report && !isLoading && (
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Header */}
            <RepoHeader
              repoName={report.repoName}
              totalCommits={report.totalCommits}
              totalContributors={report.totalContributors}
              sustainabilityScore={report.sustainabilityScore}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              report={report}
            />

            {error && (
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Key Metrics & Risk */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <DependencyRiskCard
                  busFactor={report.busFactor}
                  dependencyRisk={report.dependencyRisk}
                  topContributorShare={report.contributors[0]?.commitShare || 0}
                  topContributorName={report.contributors[0]?.username || ''}
                />

                <BurnoutChart data={report.contributors} />
              </div>

              {/* Center & Right Column - Activity & Recommendations */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <BurnoutRiskTable contributors={report.contributors} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InactivityDetector alerts={report.inactivityAlerts} />
                  <RecommendationsCard recommendations={report.recommendations} />
                </div>
              </div>
            </div>

            {/* Burnout Risk Assessment Section */}
            <BurnoutRiskAssessmentSection report={report} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
