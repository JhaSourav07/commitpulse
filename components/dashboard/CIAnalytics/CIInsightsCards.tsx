'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, BarChart3, XCircle, ShieldCheck } from 'lucide-react';
import type { CIInsights } from '@/types/ci-analytics';

interface InsightCardProps {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
  delay: number;
}

const InsightCard = ({ title, value, sub, icon: Icon, color, delay }: InsightCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="group relative overflow-hidden bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${color}/10 ${color}`}>
        <Icon size={18} />
      </div>
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
    </div>
    <div>
      <div className="text-xl font-bold text-gray-900 dark:text-white truncate">{value}</div>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  </motion.div>
);

export default function CIInsightsCards({ insights }: { insights: CIInsights }) {
  const cards = [
    {
      title: 'Fastest Workflow',
      value: insights.fastestWorkflow,
      sub: `${formatDuration(insights.fastestDuration)} avg`,
      icon: Zap,
      color: 'text-emerald-500',
      delay: 0.35,
    },
    {
      title: 'Slowest Workflow',
      value: insights.slowestWorkflow,
      sub: `${formatDuration(insights.slowestDuration)} avg`,
      icon: Clock,
      color: 'text-orange-500',
      delay: 0.4,
    },
    {
      title: 'Most Active Repository',
      value: insights.mostActiveRepo.split('/').pop() || insights.mostActiveRepo,
      sub: `${insights.mostActiveRepoRuns} total runs`,
      icon: BarChart3,
      color: 'text-blue-500',
      delay: 0.45,
    },
    {
      title: 'Most Failed Workflow',
      value: insights.mostFailedWorkflow,
      sub: `${insights.mostFailedCount} failures`,
      icon: XCircle,
      color: 'text-red-500',
      delay: 0.5,
    },
    {
      title: 'Highest Success Rate',
      value: insights.highestSuccessRepo.split('/').pop() || insights.highestSuccessRepo,
      sub: `${insights.highestSuccessRate}% success rate`,
      icon: ShieldCheck,
      color: 'text-cyan-500',
      delay: 0.55,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <InsightCard key={card.title} {...card} />
      ))}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
