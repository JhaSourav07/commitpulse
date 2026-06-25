'use client';

// components/dashboard/ExecutiveDashboard.tsx
// Executive Open Source Intelligence Center

import { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import type { ExecutiveData } from '@/types/executive';
import OrganizationMetrics from './OrganizationMetrics';
import ExecutiveInsights from './ExecutiveInsights';

interface ExecutiveDashboardProps {
  org: string;
}

export default function ExecutiveDashboard({ org }: ExecutiveDashboardProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExecutiveData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/executive?org=${org}`);
        if (!response.ok) throw new Error('Failed to fetch executive data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchExecutiveData();
  }, [org]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4" role="status" aria-label="Loading executive data">
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
    <section
      className="space-y-6"
      aria-labelledby="executive-dashboard-title"
    >
      <header>
        <h2
          id="executive-dashboard-title"
          className="text-2xl font-bold text-default"
        >
          {t('dashboard.executive.title')}
        </h2>
        <p className="text-default-600 dark:text-default-400 mt-1">
          {t('dashboard.executive.subtitle')}
        </p>
      </header>

      <OrganizationMetrics kpis={data.organization} />
      
      <EngineeringScorecardSection scorecard={data.scorecard} />
      
      <RepoHealthSection repos={data.repoHealth} />
      
      <ExecutiveInsights insights={data.insights} />
    </section>
  );
}

function EngineeringScorecardSection({
  scorecard,
}: {
  scorecard: { codeQuality: number; documentation: number; communityEngagement: number; security: number; overall: number };
}) {
  const { t } = useTranslation();

  const metrics = [
    { label: t('dashboard.executive.code_quality'), value: scorecard.codeQuality, color: 'bg-blue-500' },
    { label: t('dashboard.executive.documentation'), value: scorecard.documentation, color: 'bg-green-500' },
    { label: t('dashboard.executive.community'), value: scorecard.communityEngagement, color: 'bg-purple-500' },
    { label: t('dashboard.executive.security'), value: scorecard.security, color: 'bg-red-500' },
  ];

  return (
    <section aria-labelledby="scorecard-title" className="bg-default-50 dark:bg-default-900 rounded-lg p-4">
      <h3 id="scorecard-title" className="text-lg font-semibold mb-4">
        {t('dashboard.executive.scorecard')}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {metrics.map((m) => (
          <div key={m.label} className="text-center">
            <div className="text-3xl font-bold">{m.value}%</div>
            <p className="text-sm text-default-600 dark:text-default-400">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="h-4 bg-default-200 dark:bg-default-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 transition-all"
          style={{ width: `${scorecard.overall}%` }}
          role="progressbar"
          aria-valuenow={scorecard.overall}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="text-center mt-2 font-medium">
        {t('dashboard.executive.overall')}: {scorecard.overall}%
      </p>
    </section>
  );
}

function RepoHealthSection({
  repos,
}: {
  repos: Array<{ name: string; health: number; stars: number; openIssues: number; lastCommit: string }>;
}) {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="repo-health-title">
      <h3 id="repo-health-title" className="text-lg font-semibold mb-4">
        {t('dashboard.executive.repo_health')}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default-200 dark:border-default-800">
              <th className="text-left py-2">{t('dashboard.executive.repo')}</th>
              <th className="text-right py-2">{t('dashboard.executive.health')}</th>
              <th className="text-right py-2">⭐</th>
              <th className="text-right py-2">{t('dashboard.executive.issues')}</th>
              <th className="text-right py-2">{t('dashboard.executive.last_commit')}</th>
            </tr>
          </thead>
          <tbody>
            {repos.map((repo, i) => (
              <tr key={i} className="border-b border-default-100 dark:border-default-900">
                <td className="py-2 font-medium">{repo.name}</td>
                <td className="text-right">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      repo.health >= 80
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : repo.health >= 60
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {repo.health}%
                  </span>
                </td>
                <td className="text-right">{repo.stars}</td>
                <td className="text-right">{repo.openIssues}</td>
                <td className="text-right text-default-500">{repo.lastCommit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
