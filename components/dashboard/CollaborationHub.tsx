'use client';

import { motion } from 'framer-motion';
import {
  Users,
  GitPullRequest,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { CollaborationData } from '@/types/collaboration';

interface CollaborationHubProps {
  data: CollaborationData;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">{label}</span>
      </div>
      <div className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</div>
      {subtext && <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{subtext}</div>}
    </div>
  );
}

function CollaboratorList({
  collaborators,
}: {
  collaborators: CollaborationData['collaborators'];
}) {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <Users size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {t('dashboard.collaboration.top_collaborators')}
        </h3>
      </div>
      <div className="space-y-2">
        {collaborators.slice(0, 5).map((collab) => (
          <div
            key={collab.id}
            className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-[#111]"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold">
                {collab.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-zinc-900 dark:text-white">
                {collab.username}
              </span>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {collab.contributions} contributions
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewMetricsCard({ metrics }: { metrics: CollaborationData['reviewMetrics'] }) {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <GitPullRequest size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {t('dashboard.collaboration.review_metrics')}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Avg. Review Time</div>
          <div className="text-lg font-bold text-zinc-900 dark:text-white">
            {metrics.averageReviewTime}h
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Total Reviews</div>
          <div className="text-lg font-bold text-zinc-900 dark:text-white">
            {metrics.totalReviews}
          </div>
        </div>
      </div>
    </div>
  );
}

function BusFactorCard({
  busFactor,
}: {
  busFactor: CollaborationData['overallMetrics']['busFactor'];
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Bus Factor Risk</h3>
      </div>
      <div className="space-y-2">
        {busFactor.map((repo) => (
          <div key={repo.repository} className="flex items-center justify-between">
            <span className="text-xs text-zinc-700 dark:text-zinc-300">{repo.repository}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                {repo.score}%
              </span>
              {repo.atRisk && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-500">
                  Risk
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamConnectivityCard({ teams }: { teams: CollaborationData['teamConnectivity'] }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Team Connectivity</h3>
      </div>
      <div className="space-y-2">
        {teams.map((team) => (
          <div key={team.teamId} className="p-2 rounded-lg bg-zinc-100 dark:bg-[#111]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                {team.teamName}
              </span>
              <span className="text-xs font-bold text-emerald-500">{team.connectivityScore}%</span>
            </div>
            <div className="w-full h-1 bg-zinc-200 dark:bg-[#222] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${team.connectivityScore}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CollaborationHub({ data }: CollaborationHubProps) {
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
        <Award size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
          {t('dashboard.collaboration.title')}
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          icon={Users}
          label="Total Collaborators"
          value={data.overallMetrics.totalCollaborators}
          subtext={`${data.overallMetrics.activeCollaborators} active`}
        />
        <MetricCard
          icon={GitPullRequest}
          label="Avg Interactions"
          value={data.overallMetrics.averageInteractions}
        />
        <MetricCard
          icon={MessageSquare}
          label="Diversity Score"
          value={`${data.overallMetrics.collaborationDiversityScore}%`}
        />
        <MetricCard
          icon={TrendingUp}
          label="Collaboration Trend"
          value="↑ 12%"
          subtext="vs last month"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CollaboratorList collaborators={data.collaborators} />
        <ReviewMetricsCard metrics={data.reviewMetrics} />
        <BusFactorCard busFactor={data.overallMetrics.busFactor} />
        <TeamConnectivityCard teams={data.teamConnectivity} />
      </div>
    </motion.div>
  );
}
