'use client';

import { motion } from 'framer-motion';
import { Globe, Users, GitPullRequest, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { OSSProjectHealth } from '@/types/opensource';

interface OSSDashboardProps {
  data: OSSProjectHealth;
}

function HealthScoreCard({ score }: { score: OSSProjectHealth['healthScore'] }) {
  const getColor = (value: number) =>
    value >= 75 ? 'text-emerald-500' : value >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Health Score</h3>
      </div>
      <div className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">{score.overall}</div>
      <div className="flex gap-2">
        {['contributorHealth', 'issueManagement', 'releaseHealth', 'communityEngagement'].map(
          (key) => (
            <div key={key} className="flex-1">
              <div className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div
                className={`text-xs font-bold ${getColor(score[key as keyof typeof score] as number)}`}
              >
                {score[key as keyof typeof score] as number}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function CommunityCard({ data }: { data: OSSProjectHealth }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <Users size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Community</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-zinc-500 dark:text-[#A1A1AA]">Total Contributors</div>
          <div className="text-lg font-bold text-zinc-900 dark:text-white">
            {data.communityGrowth.totalContributors}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 dark:text-[#A1A1AA]">Active (30d)</div>
          <div className="text-lg font-bold text-emerald-500">
            {data.communityGrowth.activeContributorsLastMonth}
          </div>
        </div>
      </div>
    </div>
  );
}

function IssueMetricsCard({ metrics }: { metrics: OSSProjectHealth['issueMetrics'] }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <GitPullRequest size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Issue Metrics</h3>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Open Issues</span>
          <span className="text-xs font-semibold text-zinc-900 dark:text-white">
            {metrics.openIssues}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Avg Response</span>
          <span className="text-xs font-semibold text-zinc-900 dark:text-white">
            {metrics.averageFirstResponseTime}h
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Resolution Time</span>
          <span className="text-xs font-semibold text-zinc-900 dark:text-white">
            {metrics.averageResolutionTime}h
          </span>
        </div>
      </div>
    </div>
  );
}

function ReleaseCard({ metrics }: { metrics: OSSProjectHealth['releaseMetrics'] }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <Package size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Releases</h3>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Total Releases</span>
          <span className="text-xs font-semibold text-zinc-900 dark:text-white">
            {metrics.totalReleases}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Latest</span>
          <span className="text-xs font-semibold text-emerald-500">
            {metrics.latestRelease.version}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Avg Interval</span>
          <span className="text-xs font-semibold text-zinc-900 dark:text-white">
            {metrics.averageReleaseInterval}d
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OSSDashboard({ data }: OSSDashboardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] shadow-sm"
    >
      <div className="flex items-center gap-2 mb-5">
        <Globe size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
          {t('dashboard.opensource.title')}
        </h2>
        <span className="ml-auto text-xs text-zinc-500 dark:text-[#A1A1AA]">
          {data.projectName}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthScoreCard score={data.healthScore} />
        <CommunityCard data={data} />
        <IssueMetricsCard metrics={data.issueMetrics} />
        <ReleaseCard metrics={data.releaseMetrics} />
      </div>

      {data.healthScore.riskIndicators.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-xs font-semibold text-red-500">Risk Indicators</span>
          </div>
          <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
            {data.healthScore.riskIndicators.map((risk, i) => (
              <li key={i}>{risk}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
