'use client';

import { motion } from 'framer-motion';
import {
  Flame,
  TrendingUp,
  GitCommit,
  GitBranch,
  Users,
  UserPlus,
  Award,
  LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Flame,
  TrendingUp,
  GitCommit,
  GitBranch,
  Users,
  UserPlus,
  Award,
};

export interface ComparisonStatsCardProps {
  title: string;
  valueA: number;
  valueB: number;
  labelA: string;
  labelB: string;
  icon: string;
}

export default function ComparisonStatsCard({
  title,
  valueA,
  valueB,
  labelA,
  labelB,
  icon,
}: ComparisonStatsCardProps) {
  const isEmptyComparison = valueA === 0 && valueB === 0;
  const IconComponent = iconMap[icon] || Award;

  const total = valueA + valueB;
  const pctA = total > 0 ? (valueA / total) * 100 : 50;
  const pctB = total > 0 ? (valueB / total) * 100 : 50;

  const isWinnerA = valueA > valueB;
  const isWinnerB = valueB > valueA;

  const idA = `label-a-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const idB = `label-b-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      role="region"
      aria-label={`${title} comparison between ${labelA} and ${labelB}`}
      className="group p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.14)] hover:shadow-[0_0_24px_rgba(16,185,129,0.04)] transition-all duration-200 relative overflow-hidden"
    >
      {/* Title & Icon Header */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">{title}</p>
        <div
          className="p-2 rounded-lg bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-[rgba(255,255,255,0.06)] group-hover:border-[rgba(16,185,129,0.2)] transition-colors duration-200"
          aria-hidden="true"
        >
          <IconComponent
            size={18}
            className="text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors duration-200"
          />
        </div>
      </div>

      {/* Side-by-side values */}
      <div className="grid grid-cols-2 gap-4 items-center mb-6 relative">
        {/* User A Side */}
        <div className={`text-left pr-4 ${isWinnerA ? 'border-r border-emerald-500/10' : ''}`}>
          <p id={idA} className="text-xs text-gray-500 truncate mb-1" title={labelA}>
            {labelA}
          </p>
          <div className="flex items-baseline gap-2">
            <span
              aria-describedby={idA}
              className={`text-3xl font-bold tracking-tight transition-colors duration-300 ${
                isWinnerA
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold drop-shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {valueA.toLocaleString()}
            </span>
            {isWinnerA && (
              <span
                aria-live="polite"
                aria-label={`${labelA} is the winner`}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wide"
              >
                Winner
              </span>
            )}
          </div>
        </div>

        {/* User B Side */}
        <div className="text-right pl-4">
          <p id={idB} className="text-xs text-gray-500 truncate mb-1" title={labelB}>
            {labelB}
          </p>
          <div className="flex items-baseline justify-end gap-2">
            {isWinnerB && (
              <span
                aria-live="polite"
                aria-label={`${labelB} is the winner`}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wide"
              >
                Winner
              </span>
            )}
            <span
              aria-describedby={idB}
              className={`text-3xl font-bold tracking-tight transition-colors duration-300 ${
                isWinnerB
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold drop-shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {valueB.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Visual center divider (desktop only) */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-8 bg-black/5 dark:bg-white/5 pointer-events-none hidden md:block"
        />
      </div>

      {/* Comparison Progress Bar */}
      <div
        role="progressbar"
        aria-label={`${labelA} vs ${labelB} progress comparison`}
        aria-valuenow={Math.round(pctA)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full h-2 bg-gray-100 dark:bg-[#111] rounded-full overflow-hidden flex border border-black/5 dark:border-[rgba(255,255,255,0.04)]"
      >
        {isEmptyComparison ? (
          <div className="w-full h-full bg-zinc-300 dark:bg-zinc-800" />
        ) : (
          <>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctA}%` }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-l-full ${
                isWinnerA
                  ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  : 'bg-zinc-400 dark:bg-zinc-600'
              }`}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctB}%` }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-r-full ${
                isWinnerB
                  ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  : 'bg-zinc-400 dark:bg-zinc-600'
              }`}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}
