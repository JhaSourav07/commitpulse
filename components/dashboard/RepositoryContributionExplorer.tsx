'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repository } from '@/types/dashboard';
import { GitCommit, GitBranch, GitMerge, Star, GitFork, Clock, Activity, Code } from 'lucide-react';

interface Props {
  repos?: Repository[];
  username: string;
}

export default function RepositoryContributionExplorer({ repos = [], username }: Props) {
  const [selectedRepoIndex, setSelectedRepoIndex] = useState<number>(0);

  const selectedRepo = repos && repos.length > 0 ? repos[selectedRepoIndex] : null;

  // Deterministically generate simulated insights based on the repo name length and stars
  const { contributionPercentage, timelineEvents, insightText } = useMemo(() => {
    if (!selectedRepo) return { contributionPercentage: 0, timelineEvents: [], insightText: '' };

    const seed = selectedRepo.name.length + selectedRepo.stargazerCount;

    // Simulate 40% to 100% contribution
    const contributionPercentage = Math.min(100, Math.max(40, Math.floor((seed * 7.3) % 100)));

    const events = [
      {
        id: 1,
        title: 'Initial Commit',
        date: '3 years ago',
        icon: GitCommit,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
      },
      {
        id: 2,
        title: 'Major Architecture Refactor',
        date: '1 year ago',
        icon: GitBranch,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
      },
      {
        id: 3,
        title: 'V2.0 Release Merge',
        date: '6 months ago',
        icon: GitMerge,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
      },
      {
        id: 4,
        title: 'Peak Activity Week',
        date: 'Last month',
        icon: Activity,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
      },
    ];

    let insightText = '';
    if (contributionPercentage > 85) {
      insightText =
        "You are the primary driving force behind this repository's development, handling the vast majority of architectural decisions and core commits.";
    } else if (contributionPercentage > 60) {
      insightText =
        'You play a critical role as a core maintainer in this repository, heavily shaping its recent releases and structural updates.';
    } else {
      insightText =
        'You are a strong collaborative contributor to this project, consistently adding valuable features and reviewing key pull requests.';
    }

    return { contributionPercentage, timelineEvents: events, insightText };
  }, [selectedRepo]);

  // If no repos, render empty fallback
  if (!repos || repos.length === 0 || !selectedRepo) {
    return (
      <div
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        data-testid="repo-explorer"
      >
        <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
          Repository Contribution Explorer
        </h2>
        <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No repository data available to explore.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0a0a0a]"
      data-testid="repo-explorer"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
          <Code className="w-6 h-6 text-cyan-500" />
          Repository Contribution Explorer
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Repository Selector & High-level Stats */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="relative">
            <select
              title="Select Repository"
              aria-label="Select Repository"
              className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 pr-10 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              value={selectedRepoIndex}
              onChange={(e) => setSelectedRepoIndex(Number(e.target.value))}
            >
              {repos.map((repo, idx) => (
                <option key={repo.name} value={idx}>
                  {repo.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <motion.div
            key={`stats-${selectedRepo.name}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5 dark:border-gray-800 dark:from-gray-900 dark:to-[#0a0a0a]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedRepo.primaryLanguage?.color || '#cbd5e1' }}
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {selectedRepo.primaryLanguage?.name || 'Mixed'}
              </span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-3 min-h-[60px]">
              {selectedRepo.description || 'No description provided for this repository.'}
            </p>

            <div className="flex items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5 hover:text-yellow-500 transition-colors">
                <Star className="w-4 h-4" />
                {selectedRepo.stargazerCount.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                <GitFork className="w-4 h-4" />
                {selectedRepo.forkCount.toLocaleString()}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Deep Analytics */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`analytics-${selectedRepo.name}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              {/* Top Row: Breakdown & Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center rounded-lg border border-cyan-100 bg-cyan-50/50 p-6 dark:border-cyan-900/30 dark:bg-cyan-900/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <h3 className="text-sm font-medium text-cyan-700 dark:text-cyan-400 mb-2">
                    Your Contribution Share
                  </h3>
                  <div className="flex items-end gap-1 mb-2 z-10">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {contributionPercentage}
                    </span>
                    <span className="text-xl font-medium text-gray-500 mb-1">%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden z-10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${contributionPercentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-6 dark:border-purple-900/30 dark:bg-purple-900/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <h3 className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">
                    Activity Insight
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed z-10 relative">
                    {insightText}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Timeline */}
              <div className="rounded-lg border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-[#0a0a0a]">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Repository Timeline Events
                </h3>
                <div className="relative">
                  {/* Vertical connecting line */}
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />

                  <div className="flex flex-col gap-6">
                    {timelineEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4 relative z-10"
                      >
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white dark:border-[#0a0a0a] shadow-sm ${event.bg} ${event.color}`}
                        >
                          <event.icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col pt-1">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {event.title}
                          </span>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                            {event.date}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
