import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PRInsightData } from '@/services/github/pr-insights';

export default function PRStatusDistribution({ data }: { data: PRInsightData }) {
  const chartData = [
    { name: 'Merged', value: data.mergedPRs, color: '#10b981' }, // Emerald
    { name: 'Open', value: data.openPRs, color: '#3b82f6' }, // Blue
    { name: 'Closed', value: data.closedPRs, color: '#ef4444' }, // Red
  ].filter((item) => item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-3xl p-6 h-full flex flex-col"
    >
      <div className="mb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Status Distribution</h2>
        <p className="text-sm text-gray-500">Breakdown of PR states</p>
      </div>

      <div className="flex-1 relative min-h-[250px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
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
              animationBegin={400}
              animationDuration={1000}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(24, 24, 27, 0.9)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
              }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{data.totalPRs}</span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Total</span>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {item.name} <span className="text-gray-400">({item.value})</span>
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
