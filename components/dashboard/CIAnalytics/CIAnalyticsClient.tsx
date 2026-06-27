'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, BarChart3 } from 'lucide-react';
import type { CIAnalyticsData, CIAnalyticsFilters } from '@/types/ci-analytics';
import CIMetricsRow from './CIMetricsRow';
import CIWorkflowChart from './CIWorkflowChart';
import CIWorkflowTable from './CIWorkflowTable';
import CIRepoHealth from './CIRepoHealth';
import CIInsightsCards from './CIInsightsCards';
import CIFilters from './CIFilters';

export default function CIAnalyticsClient({ username }: { username: string }) {
  const [data, setData] = useState<CIAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CIAnalyticsFilters>({
    repository: '',
    branch: '',
    workflow: '',
    timeRange: 'all',
    status: '',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/ci-analytics?username=${encodeURIComponent(username)}`);
        if (!res.ok) throw new Error('Failed to fetch CI analytics');
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

  const filteredData = useMemo(() => {
    if (!data) return null;

    const filtered = { ...data };

    if (filters.repository || filters.branch || filters.workflow || filters.status) {
      filtered.recentRuns = data.recentRuns.filter((run) => {
        if (
          filters.repository &&
          !run.repository.toLowerCase().includes(filters.repository.toLowerCase())
        )
          return false;
        if (filters.branch && !run.branch.toLowerCase().includes(filters.branch.toLowerCase()))
          return false;
        if (filters.workflow && !run.name.toLowerCase().includes(filters.workflow.toLowerCase()))
          return false;
        if (filters.status && run.conclusion !== filters.status && run.status !== filters.status)
          return false;
        return true;
      });
    }

    return filtered;
  }, [data, filters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-cyan-500" />
        <p className="font-medium">Fetching CI workflow analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <p className="font-medium">Error loading CI analytics: {error}</p>
      </div>
    );
  }

  if (data.totalRuns === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 border border-dashed border-gray-300 dark:border-zinc-800 rounded-3xl p-12">
        <BarChart3 className="w-16 h-16 mb-4 text-gray-400" />
        <p className="font-medium text-lg mb-2">No CI workflows found</p>
        <p className="text-sm text-center max-w-md">
          Create a GitHub Actions workflow to start tracking CI analytics.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-8 w-full max-w-full"
    >
      <CIFilters
        filters={filters}
        onChange={setFilters}
        repos={data.repos}
        branches={data.branches}
        workflows={data.workflows.map((w) => w.name)}
      />

      <CIMetricsRow data={filteredData || data} />

      <CIWorkflowChart data={filteredData || data} />

      <CIInsightsCards insights={data.insights} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <CIWorkflowTable runs={(filteredData || data).recentRuns} />
        <CIRepoHealth repos={data.repoHealth} />
      </div>
    </motion.div>
  );
}
