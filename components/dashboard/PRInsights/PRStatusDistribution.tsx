'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ExternalLink, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { PRInsightData } from '@/services/github/pr-insights';
import { useTranslation } from '@/context/TranslationContext';
import prService from '@/services/github/pr-service';

interface PRStatusDistributionProps {
  data?: PRInsightData;
  username?: string;
  timeoutMs?: number;
}

type FilterState = 'MERGED' | 'OPEN' | 'CLOSED' | null;

export default function PRStatusDistribution({
  data: propData,
  username,
  timeoutMs = 5000,
}: PRStatusDistributionProps) {
  const { t } = useTranslation();
  const [fetchedData, setFetchedData] = useState<PRInsightData | null>(null);
  const [loading, setLoading] = useState<boolean>(username ? true : false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterState>(null);

  const loadData = React.useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);

    const sanitized = username.trim().toLowerCase();

    // Query local cache first
    const cached = prService.getCachedData(sanitized);
    if (cached) {
      setFetchedData({
        totalPRs: cached.open + cached.closed + cached.merged,
        openPRs: cached.open,
        closedPRs: cached.closed,
        mergedPRs: cached.merged,
        prs: [],
      } as unknown as PRInsightData);
      setLoading(false);
      return;
    }

    try {
      // Race the fetch operation against a timeout
      const fetchPromise = prService.fetchPRStatusDistribution(sanitized);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]);

      // Complete cache sync
      prService.setCachedData(sanitized, result);

      setFetchedData({
        totalPRs: result.open + result.closed + result.merged,
        openPRs: result.open,
        closedPRs: result.closed,
        mergedPRs: result.merged,
        prs: [],
      } as unknown as PRInsightData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [username, timeoutMs]);

  useEffect(() => {
    if (username) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [loadData, username]);

  if (loading) {
    return (
      <div
        data-testid="pending-overlay"
        className="flex items-center justify-center p-8 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] min-h-[220px]"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-500" size={24} />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading PR distribution...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="fallback-error"
        className="flex items-center justify-center p-8 rounded-xl bg-white dark:bg-[#0a0a0a] border border-red-500/20 min-h-[220px]"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="text-red-500" size={24} />
          <p className="text-sm text-red-500 font-medium">{error}</p>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 mt-2 text-xs rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const data = propData || fetchedData;
  if (!data) return null;

  const STATE_META: Record<string, { label: string; color: string }> = {
    MERGED: { label: t('dashboard.prInsights.merged'), color: '#10b981' },
    OPEN: { label: t('dashboard.prInsights.open'), color: '#3b82f6' },
    CLOSED: { label: t('dashboard.prInsights.closed'), color: '#ef4444' },
  };

  const baseData = [
    {
      name: t('dashboard.prInsights.merged'),
      state: 'MERGED',
      value: data.mergedPRs ?? 0,
      color: '#10b981',
    },
    {
      name: t('dashboard.prInsights.open'),
      state: 'OPEN',
      value: data.openPRs ?? 0,
      color: '#3b82f6',
    },
    {
      name: t('dashboard.prInsights.closed'),
      state: 'CLOSED',
      value: data.closedPRs ?? 0,
      color: '#ef4444',
    },
  ];

  const totalCount = (data.mergedPRs ?? 0) + (data.openPRs ?? 0) + (data.closedPRs ?? 0);

  // Clean filtering: if total is zero, chartData must be completely empty to satisfy fallback tests
  const chartData = totalCount > 0 ? baseData.filter((item) => item.value > 0) : [];

  const activeMeta = activeFilter ? STATE_META[activeFilter] : null;
  const centerValue = activeMeta
    ? (baseData.find((d) => d.state === activeFilter)?.value ?? data.totalPRs ?? 0)
    : (data.totalPRs ?? 0);
  const centerLabel = activeMeta ? activeMeta.label : t('dashboard.prInsights.total');
  const centerColor = activeMeta ? activeMeta.color : undefined;

  const filteredPRs =
    activeFilter && data.prs ? data.prs.filter((pr) => pr.state === activeFilter) : [];

  function handleClick(entry: Record<string, unknown>) {
    const clicked = (entry?.state as FilterState) ?? null;
    setActiveFilter((prev) => (prev === clicked ? null : clicked));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-3xl p-6 h-full flex flex-col"
    >
      <div className="mb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.prInsights.status_title')}
        </h2>
        <p className="text-sm text-gray-500">
          {activeFilter
            ? t('dashboard.prInsights.showing_filtered', { label: activeMeta?.label || '' })
            : t('dashboard.prInsights.status_subtitle')}
        </p>
      </div>

      <div className="flex-1 relative min-h-[250px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              onClick={(entry) => handleClick(entry as unknown as Record<string, unknown>)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  style={{ transition: 'opacity 0.2s ease', cursor: 'pointer' }}
                  opacity={activeFilter === null || activeFilter === entry.state ? 1 : 0.25}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--recharts-tooltip-bg)',
                border: 'none',
                borderRadius: '12px',
                color: 'var(--recharts-tooltip-color)',
              }}
              itemStyle={{ color: 'var(--recharts-tooltip-color)' }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold" style={{ color: centerColor }}>
            <span className={centerColor ? '' : 'text-gray-900 dark:text-white'}>
              {centerValue}
            </span>
          </span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-0.5">
            {centerLabel}
          </span>
        </div>
      </div>

      {/* Render the filters layout only if there is real data present */}
      {totalCount > 0 && (
        <div className="flex justify-center gap-4 mt-2">
          {chartData.map((item) => (
            <button
              key={item.name}
              onClick={() => handleClick(item)}
              tabIndex={-1}
              className={`flex items-center gap-2 rounded-full px-2 py-1 transition-all duration-200 focus:outline-none ${
                activeFilter === item.state ? 'opacity-100' : 'opacity-60 hover:opacity-100'
              }`}
              aria-pressed={activeFilter === item.state}
              aria-label={`Filter by ${item.name} PRs`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: item.color,
                  boxShadow: activeFilter === item.state ? `0 0 6px ${item.color}` : undefined,
                }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.name} <span className="text-gray-400">({item.value})</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {activeFilter && filteredPRs.length > 0 && (
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-4"
          >
            <div className="border-t border-black/10 dark:border-white/10 pt-4 flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredPRs.map((pr) => (
                <a
                  key={pr.url}
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-2 rounded-xl px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {pr.title}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{pr.repo}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
