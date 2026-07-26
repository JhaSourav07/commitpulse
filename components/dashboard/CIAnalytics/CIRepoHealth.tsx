'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { CIRepoHealth } from '@/types/ci-analytics';

const STATUS_BADGE: Record<string, string> = {
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  failure: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
  cancelled: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
};

function getStatusColor(status: string): string {
  return (
    STATUS_BADGE[status] || 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20'
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function CIRepoHealth({ repos }: { repos: CIRepoHealth[] }) {
  if (repos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Repository CI Health
        </h2>
        <p className="text-sm text-gray-500">No repository data available.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-6 flex flex-col"
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Repository CI Health</h2>
        <p className="text-sm text-gray-500">Ranked by success rate</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/5">
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Repository
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Success Rate
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Total Runs
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Avg Duration
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Last Run
              </th>
            </tr>
          </thead>
          <tbody>
            {repos.slice(0, 10).map((repo) => (
              <tr
                key={repo.name}
                className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">
                  {repo.name.split('/').pop()}
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          repo.successRate >= 80
                            ? 'bg-emerald-500'
                            : repo.successRate >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${repo.successRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {repo.successRate}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{repo.totalRuns}</td>
                <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs font-mono">
                  {formatDuration(repo.avgDuration)}
                </td>
                <td className="py-3 px-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(repo.lastRunStatus)}`}
                  >
                    {repo.lastRunStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
