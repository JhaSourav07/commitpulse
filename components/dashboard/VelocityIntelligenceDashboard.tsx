'use client';

// components/dashboard/VelocityIntelligenceDashboard.tsx
// Engineering Velocity Intelligence Dashboard

import { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import type {
  VelocityData,
  VelocityKPI,
  TrendDataPoint,
  SprintMetrics,
  ProductivityInsight,
} from '@/types/velocity';
import VelocitySummaryCard from './VelocitySummaryCard';
import VelocityTrendChart from './VelocityTrendChart';

interface VelocityIntelligenceDashboardProps {
  username: string;
  org?: string;
  repo?: string;
  weeks?: number;
}

export default function VelocityIntelligenceDashboard({
  username,
  org,
  repo,
  weeks = 12,
}: VelocityIntelligenceDashboardProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<VelocityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVelocityData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ username, weeks: weeks.toString() });
        if (org) params.append('org', org);
        if (repo) params.append('repo', repo);

        const response = await fetch(`/api/velocity?${params}`);
        if (!response.ok) throw new Error('Failed to fetch velocity data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchVelocityData();
  }, [username, org, repo, weeks]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4" role="status" aria-label="Loading velocity data">
        <div className="h-8 w-64 bg-default-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-default-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg" role="alert">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const kpis: VelocityKPI[] = [
    {
      ...data.kpis,
      commitsPerWeek: data.kpis.commitsPerWeek,
      velocityTrend: data.kpis.velocityTrend,
    },
    { ...data.kpis, prsPerWeek: data.kpis.prsPerWeek, velocityTrend: data.kpis.velocityTrend },
    {
      ...data.kpis,
      reviewsPerWeek: data.kpis.reviewsPerWeek,
      velocityTrend: data.kpis.velocityTrend,
    },
    {
      ...data.kpis,
      issuesClosedPerWeek: data.kpis.issuesClosedPerWeek,
      velocityTrend: data.kpis.velocityTrend,
    },
  ];

  return (
    <section className="space-y-6" aria-labelledby="velocity-dashboard-title">
      <header>
        <h2 id="velocity-dashboard-title" className="text-2xl font-bold text-default">
          {t('dashboard.velocity.title')}
        </h2>
        <p className="text-default-600 dark:text-default-400 mt-1">
          {t('dashboard.velocity.subtitle')}
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <VelocitySummaryCard
          label={t('dashboard.velocity.kpis.commits')}
          value={data.kpis.commitsPerWeek}
          suffix={t('dashboard.velocity.kpis.per_week')}
          trend={data.kpis.velocityTrend}
          icon="📊"
        />
        <VelocitySummaryCard
          label={t('dashboard.velocity.kpis.prs')}
          value={data.kpis.prsPerWeek}
          suffix={t('dashboard.velocity.kpis.per_week')}
          trend={data.kpis.velocityTrend}
          icon="🔀"
        />
        <VelocitySummaryCard
          label={t('dashboard.velocity.kpis.reviews')}
          value={data.kpis.reviewsPerWeek}
          suffix={t('dashboard.velocity.kpis.per_week')}
          trend={data.kpis.velocityTrend}
          icon="👀"
        />
        <VelocitySummaryCard
          label={t('dashboard.velocity.kpis.issues')}
          value={data.kpis.issuesClosedPerWeek}
          suffix={t('dashboard.velocity.kpis.per_week')}
          trend={data.kpis.velocityTrend}
          icon="✅"
        />
      </div>

      {/* Trend Chart */}
      <VelocityTrendChart data={data.trendData} />

      {/* Sprint Metrics */}
      <SprintMetricsSection metrics={data.sprintMetrics} />

      {/* Productivity Insights */}
      <InsightsSection insights={data.productivityInsights} />
    </section>
  );
}

function SprintMetricsSection({ metrics }: { metrics: SprintMetrics }) {
  const { t } = useTranslation();

  return (
    <section
      className="bg-default-50 dark:bg-default-900 rounded-lg p-4"
      aria-labelledby="sprint-metrics-title"
    >
      <h3 id="sprint-metrics-title" className="text-lg font-semibold mb-4">
        {t('dashboard.velocity.sprint.title')}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-default-600 dark:text-default-400">
            {t('dashboard.velocity.sprint.current')}
          </p>
          <p className="text-xl font-bold">{metrics.currentSprint}</p>
        </div>
        <div>
          <p className="text-sm text-default-600 dark:text-default-400">
            {t('dashboard.velocity.kpis.commits')}
          </p>
          <p className="text-xl font-bold">{metrics.commits}</p>
        </div>
        <div>
          <p className="text-sm text-default-600 dark:text-default-400">
            {t('dashboard.velocity.kpis.prs')}
          </p>
          <p className="text-xl font-bold">{metrics.prsMerged}</p>
        </div>
        <div>
          <p className="text-sm text-default-600 dark:text-default-400">
            {t('dashboard.velocity.sprint.velocity')}
          </p>
          <p className="text-xl font-bold">{metrics.velocity}</p>
          <p className="text-xs text-default-500">
            {t('dashboard.velocity.sprint.previous')}: {metrics.previousVelocity}
          </p>
        </div>
      </div>
    </section>
  );
}

function InsightsSection({ insights }: { insights: ProductivityInsight[] }) {
  const { t } = useTranslation();

  const getInsightColor = (type: ProductivityInsight['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'negative':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-default-50 dark:bg-default-900 border-default-200 dark:border-default-800';
    }
  };

  return (
    <section aria-labelledby="insights-title">
      <h3 id="insights-title" className="text-lg font-semibold mb-4">
        {t('dashboard.velocity.insights.title')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight) => (
          <article
            key={insight.id}
            className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-sm font-medium ${
                  insight.type === 'positive'
                    ? 'text-green-600 dark:text-green-400'
                    : insight.type === 'negative'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-default-600 dark:text-default-400'
                }`}
              >
                {insight.type === 'positive' && `+${insight.change}%`}
                {insight.type === 'negative' && `${insight.change}%`}
              </span>
            </div>
            <h4 className="font-medium mb-1">{insight.title}</h4>
            <p className="text-sm text-default-600 dark:text-default-400">{insight.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
