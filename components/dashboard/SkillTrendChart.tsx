'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SkillHistoryPoint {
  month: string;
  score: number;
}

interface SkillTrendChartProps {
  history: SkillHistoryPoint[];
  color: string;
  language: string;
}

export default function SkillTrendChart({
  history,
  color,
  language,
}: SkillTrendChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard SSR hydration guard
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-48 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg animate-pulse" />
    );
  }

  return (
    <div className="w-full h-48 mt-4" data-testid="skill-trend-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={history}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`grad-${language}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            stroke="#888888"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(18, 18, 18, 0.85)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '11px',
              color: '#ffffff',
            }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Area
            type="monotone"
            dataKey="score"
            name={`${language} Skill`}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#grad-${language})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
