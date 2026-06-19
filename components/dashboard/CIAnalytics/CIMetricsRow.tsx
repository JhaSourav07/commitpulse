'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Ban, TrendingUp, Clock, Activity } from 'lucide-react';
import type { CIAnalyticsData } from '@/types/ci-analytics';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  delay?: number;
  suffix?: string;
  color?: string;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  delay = 0,
  suffix = '',
  color = 'text-cyan-500',
}: MetricCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="group relative overflow-hidden bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300"
  >
    <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
      <Icon size={80} />
    </div>
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${color.replace('text', 'bg')}/10 ${color}`}>
        <Icon size={20} />
      </div>
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
        {title}
      </h3>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix && <span className="text-xl text-gray-500 font-medium ml-1">{suffix}</span>}
      </span>
    </div>
  </motion.div>
);

export default function CIMetricsRow({ data }: { data: CIAnalyticsData }) {
  const cards = [
    {
      title: 'Successful Runs',
      value: data.successfulRuns,
      icon: CheckCircle2,
      delay: 0.05,
      color: 'text-emerald-500',
    },
    {
      title: 'Failed Runs',
      value: data.failedRuns,
      icon: XCircle,
      delay: 0.1,
      color: 'text-red-500',
    },
    {
      title: 'Cancelled Runs',
      value: data.cancelledRuns,
      icon: Ban,
      delay: 0.15,
      color: 'text-yellow-500',
    },
    {
      title: 'Success Rate',
      value: data.successRate,
      suffix: '%',
      icon: TrendingUp,
      delay: 0.2,
      color: 'text-cyan-500',
    },
    {
      title: 'Avg Build Duration',
      value: formatDuration(data.avgBuildDuration),
      icon: Clock,
      delay: 0.25,
      color: 'text-purple-500',
    },
    {
      title: 'Total Workflow Runs',
      value: data.totalRuns,
      icon: Activity,
      delay: 0.3,
      color: 'text-blue-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} />
      ))}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
