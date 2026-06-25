import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PRInsightData } from '@/services/github/pr-insights';
import { useTranslation } from '@/context/TranslationContext';

export default function PRTrendChart({ data }: { data: PRInsightData }) {
  const { t } = useTranslation();
  const [view, setView] = useState<'weekly' | 'monthly'>('monthly');

  const chartData = view === 'weekly' ? data.weeklyActivity : data.monthlyActivity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-3xl p-6 h-full flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.prInsights.trend_title')}
          </h2>
          <p className="text-sm text-gray-500">{t('dashboard.prInsights.trend_subtitle')}</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setView('weekly')}
            className={`cursor-pointer px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'weekly' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            {t('dashboard.prInsights.weekly')}
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`cursor-pointer px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'monthly' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            {t('dashboard.prInsights.monthly')}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] text-gray-400 dark:text-white/35">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(156, 163, 175, 0.2)"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'currentColor', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--recharts-tooltip-bg)',
                border: 'none',
                borderRadius: '12px',
                color: 'var(--recharts-tooltip-color)',
              }}
              itemStyle={{ color: 'var(--recharts-tooltip-accent)' }}
            />
            <Area
              type="monotone"
              dataKey="prs"
              name={t('dashboard.prInsights.prs')}
              stroke="#06b6d4"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorPrs)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
