'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Users, TrendingUp, AlertTriangle, Activity, Target, Flame } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { TeamHealthData, TeamHealthScore } from '@/types/enterprise';

interface EnterpriseHealthProps {
  data: TeamHealthData;
  healthScore: TeamHealthScore;
}

function HealthScoreCard({ score }: { score: TeamHealthScore }) {
  const { t } = useTranslation();
  const scoreColor =
    score.level === 'excellent'
      ? 'text-emerald-500'
      : score.level === 'good'
        ? 'text-blue-500'
        : score.level === 'fair'
          ? 'text-yellow-500'
          : 'text-red-500';

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {t('dashboard.enterprise.health_score')}
        </h3>
      </div>
      <div className="text-center">
        <div className={`text-4xl font-bold ${scoreColor}`}>{score.overall}</div>
        <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 capitalize">{score.level}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-white">
            {score.productivity}
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
            {t('dashboard.enterprise.productivity')}
          </p>
        </div>
        <div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-white">
            {score.sustainability}
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
            {t('dashboard.enterprise.sustainability')}
          </p>
        </div>
        <div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-white">
            {score.collaboration}
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
            {t('dashboard.enterprise.collaboration')}
          </p>
        </div>
      </div>
    </div>
  );
}

function TeamMetricsCard({ data }: { data: TeamHealthData }) {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <Users size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {t('dashboard.enterprise.team_metrics')}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-zinc-100 dark:bg-[#111]">
          <div className="flex items-center gap-1">
            <Users size={12} className="text-zinc-500 dark:text-[#A1A1AA]" />
            <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              {t('dashboard.enterprise.total_members')}
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
            {data.metrics.totalMembers}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-100 dark:bg-[#111]">
          <div className="flex items-center gap-1">
            <Activity size={12} className="text-zinc-500 dark:text-[#A1A1AA]" />
            <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              {t('dashboard.enterprise.active_members')}
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
            {data.metrics.activeMembers}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-100 dark:bg-[#111]">
          <div className="flex items-center gap-1">
            <Flame size={12} className="text-zinc-500 dark:text-[#A1A1AA]" />
            <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              {t('dashboard.enterprise.combined_streak')}
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
            {data.metrics.combinedCurrentStreak}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-100 dark:bg-[#111]">
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-zinc-500 dark:text-[#A1A1AA]" />
            <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              {t('dashboard.enterprise.total_contributions')}
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
            {data.metrics.combinedContributions.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function SprintProgressCard({
  sprints,
}: {
  sprints: {
    name: string;
    progressPercentage: number;
    targetContributions: number;
    currentContributions: number;
  }[];
}) {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <Target size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {t('dashboard.enterprise.sprint_progress')}
        </h3>
      </div>
      {sprints.map((sprint, i) => (
        <div key={i} className="mb-3 last:mb-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {sprint.name}
            </span>
            <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              {sprint.progressPercentage}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-[#222] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sprint.progressPercentage}%` }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] mt-1">
            {sprint.currentContributions} / {sprint.targetContributions}{' '}
            {t('dashboard.enterprise.contributions')}
          </p>
        </div>
      ))}
    </div>
  );
}

function BurnoutRiskCard({
  burnoutRisk,
}: {
  burnoutRisk: { level: string; score: number; indicators: string[]; recommendations: string[] };
}) {
  const { t } = useTranslation();
  const levelColor =
    burnoutRisk.level === 'low'
      ? 'text-emerald-500 bg-emerald-500/10'
      : burnoutRisk.level === 'medium'
        ? 'text-yellow-500 bg-yellow-500/10'
        : burnoutRisk.level === 'high'
          ? 'text-orange-500 bg-orange-500/10'
          : 'text-red-500 bg-red-500/10';

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {t('dashboard.enterprise.burnout_risk')}
        </h3>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${levelColor}`}>
          {burnoutRisk.level}
        </span>
        <span className="text-lg font-bold text-zinc-900 dark:text-white">{burnoutRisk.score}</span>
      </div>
      {burnoutRisk.indicators.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-zinc-500 dark:text-[#A1A1AA] uppercase mb-1">
            {t('dashboard.enterprise.indicators')}
          </p>
          <ul className="space-y-1">
            {burnoutRisk.indicators.map((indicator, i) => (
              <li
                key={i}
                className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-1"
              >
                <span className="text-[8px] mt-1">•</span>
                {indicator}
              </li>
            ))}
          </ul>
        </div>
      )}
      {burnoutRisk.recommendations.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 dark:text-[#A1A1AA] uppercase mb-1">
            {t('dashboard.enterprise.recommendations')}
          </p>
          <ul className="space-y-1">
            {burnoutRisk.recommendations.map((rec, i) => (
              <li
                key={i}
                className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-1"
              >
                <span className="text-emerald-500 mt-0.5">✓</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function EnterpriseHealth({ data, healthScore }: EnterpriseHealthProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] shadow-sm"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            {data.teamName}
          </h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthScoreCard score={healthScore} />
        <TeamMetricsCard data={data} />
        <SprintProgressCard sprints={data.sprintProgress} />
        <BurnoutRiskCard burnoutRisk={data.burnoutRisk} />
      </div>
    </motion.div>
  );
}
