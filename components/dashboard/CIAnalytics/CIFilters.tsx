'use client';

import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import type { CIAnalyticsFilters } from '@/types/ci-analytics';

interface CIFiltersProps {
  filters: CIAnalyticsFilters;
  onChange: (filters: CIAnalyticsFilters) => void;
  repos: string[];
  branches: string[];
  workflows: string[];
}

const TIME_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

export default function CIFilters({
  filters,
  onChange,
  repos,
  branches,
  workflows,
}: CIFiltersProps) {
  const update = (key: keyof CIAnalyticsFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const reset = () => {
    onChange({ repository: '', branch: '', workflow: '', timeRange: 'all', status: '' });
  };

  const hasFilters =
    filters.repository ||
    filters.branch ||
    filters.workflow ||
    filters.timeRange !== 'all' ||
    filters.status;

  return (
    <div className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter size={16} className="text-gray-500" />
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Filters
        </span>
        {hasFilters && (
          <button
            onClick={reset}
            className="ml-auto flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Repository..."
            value={filters.repository}
            onChange={(e) => update('repository', e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-800/50 border border-black/10 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
          />
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Branch..."
            value={filters.branch}
            onChange={(e) => update('branch', e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-800/50 border border-black/10 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
          />
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Workflow..."
            value={filters.workflow}
            onChange={(e) => update('workflow', e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-800/50 border border-black/10 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
          />
        </div>

        <select
          value={filters.timeRange}
          onChange={(e) => update('timeRange', e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-zinc-800/50 border border-black/10 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
        >
          {TIME_RANGES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => update('status', e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-zinc-800/50 border border-black/10 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failure">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="in_progress">Running</option>
        </select>
      </div>
    </div>
  );
}
