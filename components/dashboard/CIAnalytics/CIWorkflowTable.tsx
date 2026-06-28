'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import type { CIWorkflowRun } from '@/types/ci-analytics';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  success: {
    label: 'Success',
    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  failure: {
    label: 'Failed',
    color: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  },
  in_progress: {
    label: 'Running',
    color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  queued: {
    label: 'Queued',
    color: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20',
  },
  pending: {
    label: 'Pending',
    color: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20',
  },
  waiting: {
    label: 'Waiting',
    color: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20',
  },
  skipped: {
    label: 'Skipped',
    color: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20',
  },
  timed_out: {
    label: 'Timed Out',
    color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20',
  },
  startup_failure: {
    label: 'Startup Fail',
    color: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
  },
};

function getStatusBadge(run: CIWorkflowRun): { label: string; color: string } {
  const key = run.conclusion || run.status;
  return (
    STATUS_BADGE[key] || {
      label: key,
      color: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20',
    }
  );
}

function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export default function CIWorkflowTable({ runs }: { runs: CIWorkflowRun[] }) {
  if (runs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Recent Workflow Runs
        </h2>
        <p className="text-sm text-gray-500">No workflow runs match the current filters.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-6 flex flex-col"
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Workflow Runs</h2>
        <p className="text-sm text-gray-500">Latest pipeline executions</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/5">
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Workflow
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Repository
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Branch
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Duration
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Event
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Started
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                Finished
              </th>
              <th className="py-3 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {runs.slice(0, 20).map((run) => {
              const badge = getStatusBadge(run);
              return (
                <tr
                  key={run.id}
                  className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-2 font-medium text-gray-900 dark:text-white max-w-[180px] truncate">
                    {run.name}
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{run.repository}</td>
                  <td className="py-3 px-2">
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                      {run.branch}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${badge.color.split(' ')[0].replace('bg-', 'bg-').replace('/15', '/80')}`}
                      />
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400 font-mono text-xs">
                    {formatDuration(run.duration)}
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                      {run.triggerEvent}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">
                    {formatDateTime(run.startedAt)}
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">
                    {run.finishedAt ? formatDateTime(run.finishedAt) : '-'}
                  </td>
                  <td className="py-3 px-2">
                    <a
                      href={run.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-cyan-500 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
