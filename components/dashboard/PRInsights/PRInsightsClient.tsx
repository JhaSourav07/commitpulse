'use client';

import React, { useState, useEffect } from 'react';
import type { PRInsightData } from '@/services/github/pr-insights';
import TopMetricsRow from './TopMetricsRow';
import PRTrendChart from './PRTrendChart';
import PRStatusDistribution from './PRStatusDistribution';
import ReviewAnalytics from './ReviewAnalytics';
import RepoPerformanceTable from './RepoPerformanceTable';
import Highlights from './Highlights';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { logger } from '@/lib/logger';

function PRInsightsErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : 'Unknown error';

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 border border-dashed border-gray-300 dark:border-zinc-800 rounded-3xl gap-4">
      <p className="font-medium text-lg">Something went wrong while loading insights.</p>
      <p className="text-sm">{message}</p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="px-4 py-2 rounded-xl font-semibold text-sm text-white bg-cyan-600 hover:bg-cyan-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

export default function PRInsightsClient({ username }: { username: string }) {
  const { t } = useTranslation();
  const [data, setData] = useState<PRInsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const cacheKey = `pr-insights-${username}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          setData(JSON.parse(cached));
          setLoading(false);
          return; // Skip fetch if cached, or you could do SWR style and still fetch. The requirement says "before triggering database retrievals".
        } catch (e) {
          // ignore cache parse error
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        setLoading(true);
        const res = await fetch(`/api/pr-insights?username=${encodeURIComponent(username)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('Failed to fetch PR insights');
        const json = await res.json();

        localStorage.setItem(cacheKey, JSON.stringify(json));
        setData(json);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Request timed out');
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [username]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-cyan-500" />
        <p className="font-medium">{t('dashboard.prInsights.loader')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <p className="font-medium">{t('dashboard.prInsights.error', { error: error || '' })}</p>
      </div>
    );
  }

  if (data.totalPRs === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 border border-dashed border-gray-300 dark:border-zinc-800 rounded-3xl">
        <p className="font-medium text-lg">{t('dashboard.prInsights.no_activity')}</p>
        <p className="text-sm">{t('dashboard.prInsights.start_contributing')}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={PRInsightsErrorFallback}
      onError={(caughtError, info) => {
        logger.error('PRInsightsClient render exception', {
          message: caughtError instanceof Error ? caughtError.message : String(caughtError),
          componentStack: info.componentStack,
        });
      }}
    >
      <div className="flex flex-col gap-8 w-full max-w-full">
        <TopMetricsRow data={data} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PRTrendChart data={data} />
          </div>
          <div>
            <PRStatusDistribution data={data} />
          </div>
        </div>

        <Highlights highlights={data.highlights} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ReviewAnalytics data={data} />
          <RepoPerformanceTable data={data} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
