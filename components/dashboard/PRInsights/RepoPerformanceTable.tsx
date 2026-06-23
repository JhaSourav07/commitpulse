import React from 'react';
import { motion } from 'framer-motion';
import type { PRInsightData } from '@/services/github/pr-insights';

export default function RepoPerformanceTable({ data }: { data: PRInsightData }) {
  const { repoPerformance } = data;

  if (!repoPerformance || repoPerformance.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-500">
        <p>No repository data available.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
      className="bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-3xl p-6 flex flex-col overflow-hidden"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Repository Performance</h2>
        <p className="text-sm text-gray-500">PR metrics by repository</p>
      </div>

      <div className="flex-1 overflow-auto pr-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-800 text-sm font-semibold text-gray-500">
              <th className="pb-3 pr-4 font-medium uppercase tracking-wider">Repository</th>
              <th className="pb-3 px-4 font-medium uppercase tracking-wider text-right">PRs</th>
              <th className="pb-3 px-4 font-medium uppercase tracking-wider text-right">
                Merge Rate
              </th>
              <th className="pb-3 pl-4 font-medium uppercase tracking-wider text-right">Reviews</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
            {repoPerformance.map((repo) => (
              <tr
                key={repo.name}
                className="group hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <td className="py-3 pr-4">
                  <div
                    className="font-medium text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px]"
                    title={repo.name}
                  >
                    {repo.name.split('/')[1] || repo.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[200px]">
                    {repo.name.split('/')[0]}
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-medium text-gray-700 dark:text-gray-300">
                  {repo.totalPRs}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {repo.mergeRate.toFixed(0)}%
                    </span>
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${repo.mergeRate}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 pl-4 text-right font-medium text-gray-700 dark:text-gray-300">
                  {repo.reviewCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
