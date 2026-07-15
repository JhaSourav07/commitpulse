'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useTranslation } from '@/context/TranslationContext';
import type { PRInsightData } from '@/services/github/pr-insights';

export default function PRSizeDistribution({ data }: { data: PRInsightData }) {
  const { t } = useTranslation();
  const dist = data?.sizeDistribution ?? { atomic: 0, standard: 0, massive: 0 };
  const totalPRs = data?.totalPRs ?? 0;

  const chartData = [
    {
      name: t('dashboard.prInsights.size_atomic', { defaultValue: 'Atomic (<100 LOC)' }),
      value: dist.atomic,
      color: '#10b981',
    },
    {
      name: t('dashboard.prInsights.size_standard', { defaultValue: 'Standard (100–500 LOC)' }),
      value: dist.standard,
      color: '#3b82f6',
    },
    {
      name: t('dashboard.prInsights.size_massive', { defaultValue: 'Massive (>500 LOC)' }),
      value: dist.massive,
      color: '#ef4444',
    },
  ];

  const visibleData = totalPRs > 0 ? chartData : [];

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-3xl p-6 h-full flex flex-col justify-between">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.prInsights.size_title', { defaultValue: 'PR Size Distribution' })}
        </h2>
        <p className="text-sm text-gray-500">
          {t('dashboard.prInsights.size_subtitle', {
            defaultValue: 'Breakdown by total lines changed',
          })}
        </p>
      </div>

      <div className="h-[220px] w-full">
        {visibleData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            {t('dashboard.prInsights.no_data', { defaultValue: 'No PR size data available' })}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={visibleData}
              layout="vertical"
              margin={{ top: 10, right: 24, left: 10, bottom: 0 }}
            >
              <XAxis type="number" allowDecimals={false} stroke="#71717a" fontSize={11} />
              <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={11} width={135} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--recharts-tooltip-bg)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'var(--recharts-tooltip-color)',
                }}
                itemStyle={{ color: 'var(--recharts-tooltip-color)' }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {visibleData.map((item, index) => (
                  <Cell key={`cell-${index}`} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
