'use client';

// components/dashboard/DependencyIntelligenceDashboard.tsx
// Repository Dependency Intelligence Dashboard

import { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import type { DependencyData, RiskAnalysis } from '@/types/dependency';
import DependencyGraph from './DependencyGraph';
import DependencySummary from './DependencySummary';

interface DependencyIntelligenceDashboardProps {
  repo: string;
  org?: string;
}

export default function DependencyIntelligenceDashboard({
  repo,
  org,
}: DependencyIntelligenceDashboardProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<DependencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskAnalysis | null>(null);

  useEffect(() => {
    const fetchDependencyData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ repo });
        if (org) params.append('org', org);

        const response = await fetch(`/api/dependency?${params}`);
        if (!response.ok) throw new Error('Failed to fetch dependency data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDependencyData();
  }, [repo, org]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4" role="status" aria-label="Loading dependency data">
        <div className="h-8 w-64 bg-default-200 rounded" />
        <div className="h-64 bg-default-200 rounded" />
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
    <section className="space-y-6" aria-labelledby="dependency-dashboard-title">
      <header>
        <h2 id="dependency-dashboard-title" className="text-2xl font-bold text-default">
          {t('dashboard.dependency.title')}
        </h2>
        <p className="text-default-600 dark:text-default-400 mt-1">
          {t('dashboard.dependency.subtitle')}
        </p>
      </header>

      {/* Summary Cards */}
      <DependencySummary summary={data.summary} />

      {/* Dependency Graph */}
      <DependencyGraph
        nodes={data.graph.nodes}
        edges={data.graph.edges}
        onNodeSelect={(node) => console.log('Selected:', node)}
      />

      {/* Risk Analysis */}
      <RiskAnalysisSection
        risks={data.riskAnalysis}
        selectedRisk={selectedRisk}
        onSelectRisk={setSelectedRisk}
      />
    </section>
  );
}

function RiskAnalysisSection({
  risks,
  selectedRisk,
  onSelectRisk,
}: {
  risks: RiskAnalysis[];
  selectedRisk: RiskAnalysis | null;
  onSelectRisk: (risk: RiskAnalysis | null) => void;
}) {
  const { t } = useTranslation();

  const getSeverityColor = (severity: RiskAnalysis['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200';
    }
  };

  if (risks.length === 0) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p className="text-green-700 dark:text-green-300">{t('dashboard.dependency.no_risks')}</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="risk-analysis-title">
      <h3 id="risk-analysis-title" className="text-lg font-semibold mb-4">
        {t('dashboard.dependency.risk_analysis')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {risks.map((risk) => (
          <article
            key={risk.id}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${getSeverityColor(
              risk.severity
            )} ${selectedRisk?.id === risk.id ? 'ring-2 ring-offset-2' : ''}`}
            onClick={() => onSelectRisk(selectedRisk?.id === risk.id ? null : risk)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectRisk(selectedRisk?.id === risk.id ? null : risk);
              }
            }}
            aria-expanded={selectedRisk?.id === risk.id}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{risk.package}</span>
              <span className="text-xs uppercase">{risk.severity}</span>
            </div>
            <p className="text-sm mb-2">{risk.description}</p>
            {selectedRisk?.id === risk.id && (
              <div className="mt-2 pt-2 border-t border-current/20">
                <p className="text-sm font-medium">{t('dashboard.dependency.recommendation')}:</p>
                <p className="text-sm">{risk.recommendation}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
