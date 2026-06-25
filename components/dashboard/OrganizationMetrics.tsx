'use client';

// components/dashboard/OrganizationMetrics.tsx
// Organization KPI Metrics

import { useTranslation } from '@/context/TranslationContext';
import type { OrganizationKPI } from '@/types/executive';

interface OrganizationMetricsProps {
  kpis: OrganizationKPI;
}

export default function OrganizationMetrics({ kpis }: OrganizationMetricsProps) {
  const { t } = useTranslation();

  const metrics = [
    { label: t('dashboard.executive.total_repos'), value: kpis.totalRepos, icon: '📦' },
    { label: t('dashboard.executive.total_contributors'), value: kpis.totalContributors, icon: '👥' },
    { label: t('dashboard.executive.total_stars'), value: kpis.totalStars.toLocaleString(), icon: '⭐' },
    { label: t('dashboard.executive.total_forks'), value: kpis.totalForks.toLocaleString(), icon: '🍴' },
    { label: t('dashboard.executive.avg_health'), value: `${kpis.avgHealth}%`, icon: '💚' },
    { label: t('dashboard.executive.oss_score'), value: `${kpis.openSourceScore}%`, icon: '🏆' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="bg-default-50 dark:bg-default-900 rounded-lg p-4 border border-default-200 dark:border-default-800"
          role="figure"
          aria-label={`${metric.label}: ${metric.value}`}
        >
          <span className="text-2xl" aria-hidden="true">
            {metric.icon}
          </span>
          <p className="text-2xl font-bold mt-2">{metric.value}</p>
          <p className="text-sm text-default-600 dark:text-default-400">{metric.label}</p>
        </article>
      ))}
    </div>
  );
}
