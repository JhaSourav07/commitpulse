'use client';

// components/dashboard/ProductivityIntelligenceDashboard.tsx
// Developer Productivity Intelligence Dashboard

import { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import type { ProductivityData } from '@/types/productivity';
import ActivityTimeline from './ActivityTimeline';

interface ProductivityIntelligenceDashboardProps {
  username: string;
  org?: string;
}

export default function ProductivityIntelligenceDashboard({
  username,
  org,
}: ProductivityIntelligenceDashboardProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<ProductivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductivityData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ username });
        if (org) params.append('org', org);

        const response = await fetch(`/api/productivity?${params}`);
        if (!response.ok) throw new Error('Failed to fetch productivity data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProductivityData();
  }, [username, org]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4" role="status" aria-label="Loading productivity data">
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

  return (
    <section className="space-y-6" aria-labelledby="productivity-dashboard-title">
      <header>
        <h2 id="productivity-dashboard-title" className="text-2xl font-bold text-default">
          {t('dashboard.productivity.title')}
        </h2>
        <p className="text-default-600 dark:text-default-400 mt-1">
          {t('dashboard.productivity.subtitle')}
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          label={t('dashboard.productivity.commits')}
          value={data.kpis.totalCommits}
          icon="📝"
        />
        <KPICard label={t('dashboard.productivity.prs')} value={data.kpis.totalPRs} icon="🔀" />
        <KPICard
          label={t('dashboard.productivity.reviews')}
          value={data.kpis.totalReviews}
          icon="👀"
        />
        <KPICard
          label={t('dashboard.productivity.discussions')}
          value={data.kpis.totalDiscussions}
          icon="💬"
        />
        <KPICard
          label={t('dashboard.productivity.response_time')}
          value={`${data.kpis.avgResponseTime}h`}
          icon="⏱️"
        />
        <KPICard
          label={t('dashboard.productivity.score')}
          value={data.kpis.productivityScore}
          icon="📊"
          highlight
        />
      </div>

      {/* Quality Metrics */}
      <QualitySection quality={data.contributionQuality} />

      {/* Weekly Trends */}
      <WeeklyTrendsSection trends={data.weeklyTrends} />

      {/* Activity Timeline */}
      <ActivityTimeline events={data.activityTimeline} />
    </section>
  );
}

function KPICard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: number | string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={`rounded-lg p-4 border ${
        highlight
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : 'bg-default-50 dark:bg-default-900 border-default-200 dark:border-default-800'
      }`}
      role="figure"
      aria-label={`${label}: ${value}`}
    >
      <span className="text-2xl" aria-hidden="true">
        {icon}
      </span>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-sm text-default-600 dark:text-default-400">{label}</p>
    </article>
  );
}

function QualitySection({
  quality,
}: {
  quality: {
    codeReviewQuality: number;
    testCoverage: number;
    documentationScore: number;
    overallQuality: number;
  };
}) {
  const { t } = useTranslation();

  const metrics = [
    {
      label: t('dashboard.productivity.code_review_quality'),
      value: quality.codeReviewQuality,
      color: 'bg-blue-500',
    },
    {
      label: t('dashboard.productivity.test_coverage'),
      value: quality.testCoverage,
      color: 'bg-green-500',
    },
    {
      label: t('dashboard.productivity.documentation'),
      value: quality.documentationScore,
      color: 'bg-purple-500',
    },
    {
      label: t('dashboard.productivity.overall_quality'),
      value: quality.overallQuality,
      color: 'bg-orange-500',
    },
  ];

  return (
    <section aria-labelledby="quality-metrics-title">
      <h3 id="quality-metrics-title" className="text-lg font-semibold mb-4">
        {t('dashboard.productivity.quality_metrics')}
      </h3>
      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center gap-4">
            <span className="w-40 text-sm">{metric.label}</span>
            <div className="flex-1 h-4 bg-default-200 dark:bg-default-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${metric.color} transition-all duration-500`}
                style={{ width: `${metric.value}%` }}
                role="progressbar"
                aria-valuenow={metric.value}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className="w-12 text-sm text-right font-medium">{metric.value}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function WeeklyTrendsSection({
  trends,
}: {
  trends: Array<{
    week: string;
    commits: number;
    prs: number;
    reviews: number;
    discussions: number;
  }>;
}) {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="weekly-trends-title">
      <h3 id="weekly-trends-title" className="text-lg font-semibold mb-4">
        {t('dashboard.productivity.weekly_trends')}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default-200 dark:border-default-800">
              <th className="text-left py-2">{t('dashboard.productivity.week')}</th>
              <th className="text-right py-2">{t('dashboard.productivity.commits')}</th>
              <th className="text-right py-2">{t('dashboard.productivity.prs')}</th>
              <th className="text-right py-2">{t('dashboard.productivity.reviews')}</th>
              <th className="text-right py-2">{t('dashboard.productivity.discussions')}</th>
            </tr>
          </thead>
          <tbody>
            {trends.map((trend, i) => (
              <tr key={i} className="border-b border-default-100 dark:border-default-900">
                <td className="py-2">{trend.week}</td>
                <td className="text-right">{trend.commits}</td>
                <td className="text-right">{trend.prs}</td>
                <td className="text-right">{trend.reviews}</td>
                <td className="text-right">{trend.discussions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
