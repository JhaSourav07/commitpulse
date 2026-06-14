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

export default function PRInsightsClient({ username }: { username: string }) {
  const [data, setData] = useState<PRInsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/pr-insights?username=${encodeURIComponent(username)}`);
        if (!res.ok) throw new Error('Failed to fetch PR insights');
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
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
        <p className="font-medium">Crunching your pull requests...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <p className="font-medium">Error loading insights: {error}</p>
      </div>
    );
  }

  if (data.totalPRs === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 border border-dashed border-gray-300 dark:border-zinc-800 rounded-3xl">
        <p className="font-medium text-lg">No pull request activity found.</p>
        <p className="text-sm">Start contributing to see your insights here!</p>
      </div>
    );
  }

  return (
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
  );
}
