'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ActivityData } from '@/types/dashboard';

const tabs = ['1W', '1M', '3M', '1Y'];

export const getFilteredData = (data: ActivityData[], activeTab: string): ActivityData[] => {
  let days = 90;
  if (activeTab === '1W') days = 7;
  if (activeTab === '1M') days = 30;
  if (activeTab === '1Y') days = 365;

  const recent = data.slice(-days);

  // Downsample to max 60 bars to keep the visualization clean
  if (recent.length > 60) {
    const step = Math.ceil(recent.length / 60);
    return recent.filter((_, i) => i % step === 0).slice(-60);
  }
  return recent;
};

export default function ActivityLandscape({ data }: { data: ActivityData[] }) {
  const [activeTab, setActiveTab] = useState('3M');
  const [mode, setMode] = useState<'commits' | 'loc'>('commits');

  const displayData = getFilteredData(data, activeTab);

  // Helper to extract the proper value based on the selected mode
  const getValue = (day: ActivityData) =>
    mode === 'loc' ? (day.locAdditions || 0) + (day.locDeletions || 0) : day.count;

  const maxCount = Math.max(...displayData.map(getValue), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            Activity Landscape
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1">
            {mode === 'loc' ? 'Lines of code modified over time' : 'Commit frequency over time'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Toggle (Commits vs LoC) */}
          <div className="flex items-center p-0.5 bg-gray-100 dark:bg-[#111] border border-black/5 dark:border-[rgba(255,255,255,0.08)] rounded-lg">
            <button
              onClick={() => setMode('commits')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'commits'
                  ? 'bg-white dark:bg-[#222] text-black dark:text-white shadow-sm border border-black/5 dark:border-white/5'
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Commits
            </button>
            <button
              onClick={() => setMode('loc')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'loc'
                  ? 'bg-white dark:bg-[#222] text-black dark:text-white shadow-sm border border-black/5 dark:border-white/5'
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Lines of Code
            </button>
          </div>

          {/* Time Range Tabs */}
          <div className="flex rounded-lg border border-black/10 dark:border-[rgba(255,255,255,0.08)] overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-medium transition-all duration-200 border-r border-black/10 dark:border-[rgba(255,255,255,0.08)] last:border-r-0 ${
                  activeTab === tab
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-gray-100 dark:bg-transparent text-gray-600 dark:text-[#A1A1AA] hover:bg-gray-200 dark:hover:bg-[rgba(255,255,255,0.05)] hover:text-black dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Graph */}
      <div
        className="h-[200px] w-full flex items-end justify-between gap-[2px] relative"
        role="img"
        aria-label="Activity chart showing contribution frequency over time"
      >
        {displayData.map((day, i) => {
          const val = getValue(day);
          const heightPercent = Math.max((val / maxCount) * 100, 3);

          // Recalculate intensity for LoC mode visually
          const isHigh = mode === 'loc' ? val > maxCount * 0.7 : day.intensity >= 3;
          const isMedium = mode === 'loc' ? val > 0 : day.intensity > 0;

          return (
            <div
              key={i}
              className="relative flex-1 flex items-end group/bar h-full"
              aria-label={`${day.date}: ${val} ${mode === 'loc' ? 'lines' : 'commits'}`}
            >
              {/* Tooltip */}
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-white dark:bg-[#111] border border-black/10 dark:border-[rgba(255,255,255,0.1)] px-2.5 py-1.5 rounded-md opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150 pointer-events-none z-20 flex flex-col items-center whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-xl">
                <span className="text-[10px] text-[#A1A1AA]">{day.date}</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {val} {mode === 'loc' ? 'lines' : 'commits'}
                </span>
              </div>

              {/* Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ duration: 0.6, delay: i * 0.008, ease: [0.16, 1, 0.3, 1] }}
                className={`w-full rounded-t-[2px] transition-all duration-200 ${
                  isHigh
                    ? mode === 'loc'
                      ? 'bg-indigo-500 dark:bg-indigo-400'
                      : 'bg-black dark:bg-white'
                    : isMedium
                      ? mode === 'loc'
                        ? 'bg-indigo-300 dark:bg-indigo-500/50 hover:bg-indigo-400'
                        : 'bg-zinc-500 dark:bg-zinc-600 hover:bg-zinc-700 dark:hover:bg-zinc-400'
                      : 'bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* X axis */}
      <div className="w-full h-px bg-black/10 dark:bg-[rgba(255,255,255,0.06)] mt-3" />
    </motion.div>
  );
}
