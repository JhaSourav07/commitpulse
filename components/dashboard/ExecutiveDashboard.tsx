'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, AlertTriangle, Target, Zap } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { ExecutiveDashboardData } from '@/types/executive';

interface ExecutiveDashboardProps {
  data: ExecutiveDashboardData;
}

function HealthScoreCard({
  health,
}: {
  health: ExecutiveDashboardData['currentReport']['engineeringHealth'];
}) {
  const getScoreColor = (score: number) =>
    score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Engineering Health</h3>
      </div>
      <div className="text-4xl font-bold text-zinc-900 dark:text-white mb-3">
        {health.overallScore}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(health)
          .filter(([k]) => k !== 'overallScore')
          .map(([key, value]) => (
            <div key={key} className="text-center p-2 rounded-lg bg-zinc-100 dark:bg-[#111]">
              <div className={`text-lg font-bold ${getScoreColor(value as number)}`}>{value}</div>
              <div className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] capitalize">
                {key.replace('Score', '')}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function MetricsCard({ metrics }: { metrics: ExecutiveDashboardData['currentReport']['metrics'] }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Key Metrics</h3>
      </div>
      <div className="space-y-3">
        {metrics.slice(0, 4).map((metric) => (
          <div key={metric.id} className="flex justify-between items-center">
            <div>
              <div className="text-xs font-medium text-zinc-900 dark:text-white">{metric.name}</div>
              <div className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">{metric.unit}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-zinc-900 dark:text-white">{metric.value}</div>
              <div className="text-[10px] text-emerald-500">+{metric.changePercent}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InitiativesCard({
  initiatives,
}: {
  initiatives: ExecutiveDashboardData['currentReport']['initiatives'];
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-emerald-500';
      case 'at-risk':
        return 'bg-yellow-500';
      case 'delayed':
        return 'bg-red-500';
      default:
        return 'bg-zinc-500';
    }
  };

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <Target size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Strategic Initiatives
        </h3>
      </div>
      <div className="space-y-3">
        {initiatives.map((init) => (
          <div key={init.id} className="p-2 rounded-lg bg-zinc-100 dark:bg-[#111]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-zinc-900 dark:text-white">{init.name}</span>
              <span className={`w-2 h-2 rounded-full ${getStatusColor(init.status)}`} />
            </div>
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-[#222] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${init.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamCapacityCard({
  teams,
}: {
  teams: ExecutiveDashboardData['currentReport']['teamCapacity'];
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <Users size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Team Capacity</h3>
      </div>
      <div className="space-y-2">
        {teams.map((team) => (
          <div
            key={team.teamId}
            className="flex justify-between items-center p-2 rounded-lg bg-zinc-100 dark:bg-[#111]"
          >
            <span className="text-xs font-medium text-zinc-900 dark:text-white">
              {team.teamName}
            </span>
            <span className="text-xs font-bold text-emerald-500">{team.utilizationPercent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeploymentCard({
  metrics,
}: {
  metrics: ExecutiveDashboardData['currentReport']['deploymentMetrics'];
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">DORA Metrics</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-2 rounded-lg bg-zinc-100 dark:bg-[#111]">
          <div className="text-lg font-bold text-emerald-500">{metrics.frequency}</div>
          <div className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">Deploys/Day</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-zinc-100 dark:bg-[#111]">
          <div className="text-lg font-bold text-zinc-900 dark:text-white">{metrics.leadTime}h</div>
          <div className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">Lead Time</div>
        </div>
      </div>
    </div>
  );
}

function AlertsCard({ alerts }: { alerts: ExecutiveDashboardData['alerts'] }) {
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-500 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500 bg-yellow-500/10';
      default:
        return 'border-blue-500 bg-blue-500/10';
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className={`p-4 rounded-xl border ${getAlertColor(alerts[0].type)}`}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle
          size={15}
          className={alerts[0].type === 'critical' ? 'text-red-500' : 'text-yellow-500'}
        />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Alerts</h3>
      </div>
      <div className="space-y-1">
        {alerts.map((alert) => (
          <div key={alert.id} className="text-xs text-zinc-700 dark:text-zinc-300">
            {alert.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExecutiveDashboard({ data }: ExecutiveDashboardProps) {
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
        <BarChart3 size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
          {t('dashboard.executive.title')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <HealthScoreCard health={data.currentReport.engineeringHealth} />
        <MetricsCard metrics={data.currentReport.metrics} />
        <TeamCapacityCard teams={data.currentReport.teamCapacity} />
        <InitiativesCard initiatives={data.currentReport.initiatives} />
        <DeploymentCard metrics={data.currentReport.deploymentMetrics} />
        <AlertsCard alerts={data.alerts} />
      </div>

      {data.currentReport.naturalLanguageSummary && (
        <div className="mt-4 p-3 rounded-lg bg-zinc-100 dark:bg-[#111]">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {data.currentReport.naturalLanguageSummary}
          </p>
        </div>
      )}
    </motion.div>
  );
}
