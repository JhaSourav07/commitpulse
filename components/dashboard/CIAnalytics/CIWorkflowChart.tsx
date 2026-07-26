'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { CIAnalyticsData } from '@/types/ci-analytics';

const STATUS_COLORS = {
  success: '#10b981',
  failed: '#ef4444',
  cancelled: '#eab308',
  inProgress: '#3b82f6',
};

export default function CIWorkflowChart({ data }: { data: CIAnalyticsData }) {
  const [trendView, setTrendView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const donutData = [
    { name: 'Success', value: data.statusBreakdown.success, color: STATUS_COLORS.success },
    { name: 'Failed', value: data.statusBreakdown.failed, color: STATUS_COLORS.failed },
    { name: 'Cancelled', value: data.statusBreakdown.cancelled, color: STATUS_COLORS.cancelled },
    {
      name: 'In Progress',
      value: data.statusBreakdown.inProgress,
      color: STATUS_COLORS.inProgress,
    },
  ].filter((item) => item.value > 0);

  const trendData =
    trendView === 'daily'
      ? data.dailyTrend.map((d) => ({ name: d.date.slice(5), runs: d.runs }))
      : trendView === 'weekly'
        ? data.weeklyTrend.map((w) => ({ name: w.week.slice(5), runs: w.runs }))
        : data.monthlyTrend.map((m) => ({ name: m.month, runs: m.runs }));

  const totalForDonut = donutData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-6 flex flex-col"
      >
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Workflow Status</h2>
          <p className="text-sm text-gray-500">Breakdown of pipeline results</p>
        </div>

        <div className="flex-1 relative min-h-[250px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                animationBegin={300}
                animationDuration={1200}
              >
                {donutData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={donutData[index].color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(24, 24, 27, 0.9)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalForDonut}
            </span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
              Runs
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {donutData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.name} <span className="text-gray-400">({item.value})</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="lg:col-span-2 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-6 flex flex-col"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Activity Trend</h2>
            <p className="text-sm text-gray-500">Workflow runs over time</p>
          </div>
          <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
            {(['daily', 'weekly', 'monthly'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setTrendView(view)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  trendView === view
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-[280px]">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ciTrendGradient" x1="0" y1="0" x2="0" y2="1">
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
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(24, 24, 27, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Area
                  type="monotone"
                  dataKey="runs"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#ciTrendGradient)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No trend data available
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
