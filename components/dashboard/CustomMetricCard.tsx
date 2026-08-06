'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sliders, RotateCcw, Filter, X, Zap, Target, BarChart2, TrendingUp } from 'lucide-react';

export interface MetricPreset {
  id: string;
  name: string;
  description: string;
  unit: string;
  calculate: (commits: number, days: number, additions: number, deletions: number) => number;
}

export const METRIC_PRESETS: MetricPreset[] = [
  {
    id: 'velocity',
    name: 'Commit Velocity',
    description: 'Average commits logged per active development day',
    unit: 'commits/day',
    calculate: (commits, days) => (days > 0 ? parseFloat((commits / days).toFixed(2)) : 0),
  },
  {
    id: 'impact',
    name: 'Code Impact Ratio',
    description: 'Proportion of net code additions relative to total churn',
    unit: '% impact',
    calculate: (_, __, additions, deletions) => {
      const total = additions + deletions;
      return total > 0 ? Math.round((additions / total) * 100) : 0;
    },
  },
  {
    id: 'efficiency',
    name: 'Efficiency Index',
    description: 'Composite rating based on commit density and code volume',
    unit: 'points',
    calculate: (commits, days, additions) => {
      if (days === 0) return 0;
      const score = (commits * 1.5 + additions / 500) / days;
      return Math.min(100, Math.round(score * 10));
    },
  },
];

export interface CustomMetricCardProps {
  totalCommits?: number;
  activeDays?: number;
  totalAdditions?: number;
  totalDeletions?: number;
  onFilterChange?: (filters: { dateRange: string; tagFilter: string }) => void;
}

export default function CustomMetricCard({
  totalCommits = 142,
  activeDays = 28,
  totalAdditions = 4250,
  totalDeletions = 1200,
  onFilterChange,
}: CustomMetricCardProps) {
  const [selectedMetricId, setSelectedMetricId] = useState<string>('velocity');
  const [dateRange, setDateRange] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('');

  const activePreset = useMemo(() => {
    return METRIC_PRESETS.find((p) => p.id === selectedMetricId) || METRIC_PRESETS[0];
  }, [selectedMetricId]);

  // Adjust metrics based on date range selection
  const filteredData = useMemo(() => {
    let multiplier = 1;
    if (dateRange === '7d') multiplier = 0.25;
    else if (dateRange === '30d') multiplier = 0.6;
    else if (dateRange === '90d') multiplier = 0.85;

    return {
      commits: Math.round(totalCommits * multiplier),
      days: Math.max(1, Math.round(activeDays * multiplier)),
      additions: Math.round(totalAdditions * multiplier),
      deletions: Math.round(totalDeletions * multiplier),
    };
  }, [totalCommits, activeDays, totalAdditions, totalDeletions, dateRange]);

  const metricValue = useMemo(() => {
    return activePreset.calculate(
      filteredData.commits,
      filteredData.days,
      filteredData.additions,
      filteredData.deletions
    );
  }, [activePreset, filteredData]);

  const handleDateChange = (newRange: string) => {
    setDateRange(newRange);
    onFilterChange?.({ dateRange: newRange, tagFilter });
  };

  const handleTagChange = (newTag: string) => {
    setTagFilter(newTag);
    onFilterChange?.({ dateRange, tagFilter: newTag });
  };

  const handleResetFilters = () => {
    setDateRange('all');
    setTagFilter('');
    onFilterChange?.({ dateRange: 'all', tagFilter: '' });
  };

  const isFiltered = dateRange !== 'all' || tagFilter !== '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.14)] shadow-sm transition-all duration-200 w-full max-w-full flex flex-col gap-5"
      data-testid="custom-metric-card"
    >
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sliders size={18} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
              Custom Metric & Filter Panel
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Analyze performance & filter commit telemetry
            </p>
          </div>
        </div>

        {/* Quick Clear Button */}
        {isFiltered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleResetFilters}
            aria-label="Reset all quick filters"
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <RotateCcw size={13} />
            <span>Clear Filters</span>
          </motion.button>
        )}
      </div>

      {/* Preset Metric Selector */}
      <div className="flex flex-wrap gap-2">
        {METRIC_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedMetricId;
          return (
            <button
              key={preset.id}
              onClick={() => setSelectedMetricId(preset.id)}
              aria-pressed={isSelected}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {preset.id === 'velocity' && <Zap size={13} />}
              {preset.id === 'impact' && <Target size={13} />}
              {preset.id === 'efficiency' && <BarChart2 size={13} />}
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Metric Display Box */}
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {activePreset.name}
          </span>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {activePreset.unit}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight"
            data-testid="metric-value-display"
          >
            {metricValue}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({filteredData.commits} commits across {filteredData.days} days)
          </span>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activePreset.description}</p>
      </div>

      {/* Quick Filters Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {/* Date Range Selector */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="date-range-select"
            className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
          >
            <Filter size={13} />
            <span>Date Range Filter</span>
          </label>
          <select
            id="date-range-select"
            value={dateRange}
            onChange={(e) => handleDateChange(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        {/* Tag / Search Filter */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="tag-filter-input"
            className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
          >
            <TrendingUp size={13} />
            <span>Filter by Keyword/Tag</span>
          </label>
          <div className="relative">
            <input
              id="tag-filter-input"
              type="text"
              value={tagFilter}
              onChange={(e) => handleTagChange(e.target.value)}
              placeholder="e.g. feat, fix, docs..."
              className="w-full px-3 py-2 pr-8 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {tagFilter && (
              <button
                type="button"
                onClick={() => handleTagChange('')}
                aria-label="Clear tag filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
