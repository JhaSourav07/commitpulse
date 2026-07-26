'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContributorData {
  username: string;
  commitShare: number;
  totalCommits: number;
}

interface BurnoutChartProps {
  data: ContributorData[];
}

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#3b82f6', // blue
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ef4444', // red
];

export default function BurnoutChart({ data }: BurnoutChartProps) {
  // Format data for Recharts, grouping smaller contributors into "Others"
  const sortedData = [...data].sort((a, b) => b.totalCommits - a.totalCommits);
  const topContributors = sortedData.slice(0, 5);
  const otherContributors = sortedData.slice(5);

  const chartData = topContributors.map((c) => ({
    name: `@${c.username}`,
    value: c.commitShare,
    commits: c.totalCommits,
  }));

  if (otherContributors.length > 0) {
    const otherCommits = otherContributors.reduce((acc, c) => acc + c.totalCommits, 0);
    const otherShare = otherContributors.reduce((acc, c) => acc + c.commitShare, 0);
    chartData.push({
      name: 'Others',
      value: Math.round(otherShare * 100) / 100,
      commits: otherCommits,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl shadow-sm flex flex-col h-full min-h-[360px]"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={18} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
          Workload Distribution
        </h3>
      </div>

      <div className="flex-1 min-h-[240px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-3 bg-white dark:bg-zinc-950 border border-black/10 dark:border-white/10 rounded-xl shadow-md text-xs">
                      <p className="font-bold text-gray-900 dark:text-white">{data.name}</p>
                      <p className="text-gray-500 dark:text-zinc-400 mt-1">
                        Commit Share:{' '}
                        <span className="font-semibold text-gray-800 dark:text-zinc-200">
                          {data.value}%
                        </span>
                      </p>
                      <p className="text-gray-500 dark:text-zinc-400">
                        Total Commits:{' '}
                        <span className="font-semibold text-gray-800 dark:text-zinc-200">
                          {data.commits}
                        </span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
