'use client';

import { motion } from 'framer-motion';
import { Flame, TrendingUp, GitCommit, LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Flame,
  TrendingUp,
  GitCommit,
};

export function buildMiniChart(seed: number): number[] {
  return Array.from({ length: 12 }).map((_, i) => ((seed * 17 + i * 31) % 100) + (i > 6 ? 40 : 0));
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: string;
  showUTCDisclaimer?: boolean;
  utcDate?: string;
  chartData?: number[];
}

export default function StatsCard({
  title,
  value,
  description,
  icon,
  showUTCDisclaimer,
  utcDate,
  chartData,
}: StatsCardProps) {
  const IconComponent = iconMap[icon] || Flame;

  const baseSeed = title.length;

  const fallbackData = Array.from({ length: 12 }).map(
    (_, i) => ((baseSeed * 17 + i * 31) % 100) + (i > 6 ? 40 : 0)
  );
  const miniChartData = chartData && chartData.length > 0 ? chartData : fallbackData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.14)] hover:shadow-[0_0_24px_rgba(99,102,241,0.08)] transition-all duration-200 relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs text-[#A1A1AA] uppercase tracking-widest font-medium mb-3">
            {title}
          </p>

          <p className="text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {value}
          </p>

          <p className="text-xs text-[#A1A1AA] mt-1.5">{description}</p>

          {showUTCDisclaimer && (
            <div className="mt-3 space-y-1">
              <p className="text-[11px] text-[#71717A] leading-relaxed">
                â„¹ Streaks are calculated in UTC and may differ from your local timezone.
              </p>

              {utcDate && <p className="text-[10px] text-[#52525B]">UTC Date: {utcDate}</p>}
            </div>
          )}
        </div>

        <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-[rgba(255,255,255,0.06)] group-hover:border-[rgba(99,102,241,0.2)] transition-colors duration-200">
          <IconComponent
            size={18}
            className="text-[#A1A1AA] group-hover:text-black dark:group-hover:text-white transition-colors duration-200"
          />
        </div>
      </div>

      {/* Micro chart */}
      <div className="w-full h-8 flex items-end justify-between gap-px opacity-50 dark:opacity-30 group-hover:opacity-80 dark:group-hover:opacity-60 transition-opacity duration-300">
        {miniChartData.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-black dark:bg-white rounded-t-[1px]"
            style={{ height: `${Math.max(h / 1.4, 10)}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}
