'use client';

import { useState, useMemo, useCallback } from 'react';
import { RefreshCw, ArrowUpRight } from 'lucide-react';
import type { RepoActivityInfo } from '@/types/dashboard';

type InactivityFilter = 30 | 60 | 90 | 180 | 365;

const FILTER_OPTIONS: { label: string; value: InactivityFilter }[] = [
  { label: '30 Days', value: 30 },
  { label: '60 Days', value: 60 },
  { label: '90 Days', value: 90 },
  { label: '180 Days', value: 180 },
  { label: '1 Year', value: 365 },
];

function getInactiveDays(pushedAt: string | null): number | null {
  if (!pushedAt) return null;
  const diff = Date.now() - new Date(pushedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface InactiveRepoReminderProps {
  repos: RepoActivityInfo[];
}

export default function InactiveRepoReminder({ repos }: InactiveRepoReminderProps) {
  const [filter, setFilter] = useState<InactivityFilter>(90);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const inactiveRepos = useMemo(() => {
    return repos
      .map((r) => ({ ...r, inactiveDays: getInactiveDays(r.pushedAt) }))
      .filter(
        (r): r is typeof r & { inactiveDays: number } =>
          r.inactiveDays !== null && r.inactiveDays >= filter
      )
      .sort((a, b) => b.inactiveDays - a.inactiveDays);
  }, [repos, filter]);

  return (
    <div className="w-full mx-auto">
      <div className="p-5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-base opacity-80">💤</span>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Inactive Repository Reminder
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-tight mt-0.5">
                Repositories without recent pushes in your selected window
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={filter}
              onChange={(e) => setFilter(Number(e.target.value) as InactivityFilter)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 hover:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-gray-600 dark:text-zinc-400 transition-colors outline-none cursor-pointer"
              aria-label="Inactivity filter"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 hover:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-gray-600 dark:text-zinc-400 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {inactiveRepos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-2xl mb-3">🎉</span>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              No inactive repositories found for the selected time range.
            </p>
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent pr-1 space-y-2">
            {inactiveRepos.map((repo) => (
              <div
                key={repo.name}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200/60 dark:border-neutral-800/60 bg-gray-50/40 dark:bg-neutral-900/40 hover:bg-gray-100/70 dark:hover:bg-neutral-800/50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                  >
                    {repo.name}
                  </a>
                </div>

                <span className="text-xs text-gray-500 dark:text-zinc-400 shrink-0 min-w-[90px] text-right">
                  {formatDate(repo.pushedAt)}
                </span>

                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300 shrink-0 min-w-[48px] text-right tabular-nums">
                  {repo.inactiveDays !== null ? `${repo.inactiveDays}d` : '-'}
                </span>

                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 dark:text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shrink-0 p-0.5"
                  aria-label="Open on GitHub"
                >
                  <ArrowUpRight size={14} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
