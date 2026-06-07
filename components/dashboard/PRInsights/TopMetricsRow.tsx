import React from 'react';
import { motion } from 'framer-motion';
import {
  GitPullRequest,
  GitMerge,
  Clock,
  Activity,
  CheckCircle2,
  GitPullRequestDraft,
} from 'lucide-react';
import type { PRInsightData } from '@/services/github/pr-insights';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  delay?: number;
  suffix?: string;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  delay = 0,
  suffix = '',
}: MetricCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-cyan-500/50 transition-colors"
  >
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon size={80} />
    </div>
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl">
        <Icon size={20} />
      </div>
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
        {title}
      </h3>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-4xl font-bold text-gray-900 dark:text-white">
        {value}
        <span className="text-xl text-gray-500 font-medium ml-1">{suffix}</span>
      </span>
    </div>
    {trend && (
      <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 w-fit px-2.5 py-1 rounded-full">
        {trend}
      </div>
    )}
  </motion.div>
);

export default function TopMetricsRow({ data }: { data: PRInsightData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total PRs"
        value={data.totalPRs}
        icon={GitPullRequest}
        trend={
          data.weeklyActivity?.length > 0
            ? `+${data.weeklyActivity[data.weeklyActivity.length - 1].prs} this week`
            : undefined
        }
        delay={0.1}
      />
      <MetricCard
        title="Merge Rate"
        value={data.mergeRate.toFixed(1)}
        suffix="%"
        icon={GitMerge}
        delay={0.2}
      />
      <MetricCard
        title="Avg Cycle Time"
        value={data.avgCycleTime.toFixed(1)}
        suffix="hrs"
        icon={Clock}
        delay={0.3}
      />
      <MetricCard
        title="First Review"
        value={data.avgTimeToFirstReview.toFixed(1)}
        suffix="hrs"
        icon={Activity}
        delay={0.4}
      />
    </div>
  );
}
