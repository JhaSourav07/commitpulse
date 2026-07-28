'use client';

import React from 'react';
import { Search, Filter, RotateCcw, ChevronDown } from 'lucide-react';
import type { CIAnalyticsFilters } from '@/types/ci-analytics';

interface CIFiltersProps {
  filters: CIAnalyticsFilters;
  onChange: (filters: CIAnalyticsFilters) => void;
}

const TIME_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

export default function CIFilters({ filters, onChange }: CIFiltersProps) {
  const [searchType, setSearchType] = React.useState<'repository' | 'branch' | 'workflow'>(() => {
    if (filters.branch) return 'branch';
    if (filters.workflow) return 'workflow';
    return 'repository';
  });
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [prevFilters, setPrevFilters] = React.useState(filters);
  if (
    filters.repository !== prevFilters.repository ||
    filters.branch !== prevFilters.branch ||
    filters.workflow !== prevFilters.workflow
  ) {
    setPrevFilters(filters);
    if (!filters.repository && !filters.branch && filters.workflow) {
      setSearchType('workflow');
    } else if (!filters.repository && filters.branch && !filters.workflow) {
      setSearchType('branch');
    } else if (filters.repository && !filters.branch && !filters.workflow) {
      setSearchType('repository');
    }
  }

  const update = (key: keyof CIAnalyticsFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const handleSearchTypeChange = (type: 'repository' | 'branch' | 'workflow') => {
    setSearchType(type);
    let currentValue = '';
    if (searchType === 'repository') currentValue = filters.repository;
    else if (searchType === 'branch') currentValue = filters.branch;
    else if (searchType === 'workflow') currentValue = filters.workflow;

    if (type === 'repository') {
      onChange({ ...filters, branch: '', workflow: '', repository: currentValue });
    } else if (type === 'branch') {
      onChange({ ...filters, repository: '', workflow: '', branch: currentValue });
    } else if (type === 'workflow') {
      onChange({ ...filters, repository: '', branch: '', workflow: currentValue });
    }
  };

  const handleSearchTextChange = (val: string) => {
    if (searchType === 'repository') {
      onChange({ ...filters, repository: val, branch: '', workflow: '' });
    } else if (searchType === 'branch') {
      onChange({ ...filters, branch: val, repository: '', workflow: '' });
    } else if (searchType === 'workflow') {
      onChange({ ...filters, workflow: val, repository: '', branch: '' });
    }
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

  const getPlaceholder = () => {
    if (searchType === 'repository') return 'Repository...';
    if (searchType === 'branch') return 'Branch...';
    return 'Workflow...';
  };

  const getInputValue = () => {
    if (searchType === 'repository') return filters.repository;
    if (searchType === 'branch') return filters.branch;
    return filters.workflow;
  };

  return (
    <div className="relative z-30 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-3">
        <div className="flex gap-2">
          <div ref={dropdownRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-between gap-1.5 px-3 py-2 text-sm bg-white dark:bg-zinc-800/50 border border-black/10 dark:border-white/10 rounded-xl text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all cursor-pointer min-w-[96px]"
            >
              <span>
                {searchType === 'repository'
                  ? 'Repo'
                  : searchType === 'branch'
                    ? 'Branch'
                    : 'Workflow'}
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
              />
            </button>

            {isOpen && (
              <div className="absolute left-0 mt-1.5 w-32 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    handleSearchTypeChange('repository');
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 ${
                    searchType === 'repository'
                      ? 'text-cyan-500 dark:text-cyan-400 font-medium bg-cyan-50/50 dark:bg-cyan-500/10'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Repo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSearchTypeChange('branch');
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 ${
                    searchType === 'branch'
                      ? 'text-cyan-500 dark:text-cyan-400 font-medium bg-cyan-50/50 dark:bg-cyan-500/10'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Branch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSearchTypeChange('workflow');
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 ${
                    searchType === 'workflow'
                      ? 'text-cyan-500 dark:text-cyan-400 font-medium bg-cyan-50/50 dark:bg-cyan-500/10'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Workflow
                </button>
              </div>
            )}
          </div>
          <div className="relative flex-grow">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              aria-label="Text input"
              type="text"
              placeholder={getPlaceholder()}
              value={getInputValue()}
              onChange={(e) => handleSearchTextChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-800/50 border border-black/10 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
            />
          </div>
        </div>

        <div className="relative">
          <select
            value={filters.timeRange}
            onChange={(e) => update('timeRange', e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 text-sm bg-white dark:bg-zinc-800/50 border border-black/10 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all cursor-pointer"
          >
            {TIME_RANGES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => update('status', e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 text-sm bg-white dark:bg-zinc-800/50 border border-black/10 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="in_progress">Running</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
