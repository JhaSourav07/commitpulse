'use client';

// components/dashboard/VelocityTrendChart.tsx
// Trend Chart for Velocity Intelligence

import { useTranslation } from '@/context/TranslationContext';
import type { TrendDataPoint } from '@/types/velocity';

interface VelocityTrendChartProps {
  data: TrendDataPoint[];
}

export default function VelocityTrendChart({ data }: VelocityTrendChartProps) {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <div className="bg-default-50 dark:bg-default-900 rounded-lg p-8 text-center">
        <p className="text-default-500">No trend data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.commits, d.prs, d.reviews, d.issues)));

  const getBarHeight = (value: number) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  };

  return (
    <section
      className="bg-default-50 dark:bg-default-900 rounded-lg p-4"
      aria-labelledby="velocity-trends-title"
    >
      <h3 id="velocity-trends-title" className="text-lg font-semibold mb-4">
        {t('dashboard.velocity.trends.title')}
      </h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded" aria-hidden="true" />
          <span>{t('dashboard.velocity.trends.commits')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded" aria-hidden="true" />
          <span>{t('dashboard.velocity.trends.prs')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-purple-500 rounded" aria-hidden="true" />
          <span>{t('dashboard.velocity.trends.reviews')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-orange-500 rounded" aria-hidden="true" />
          <span>{t('dashboard.velocity.trends.issues')}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64" role="img" aria-label="Velocity trends bar chart">
        <div className="absolute inset-0 flex items-end justify-between gap-1 px-2">
          {data.map((point, index) => (
            <div key={index} className="flex-1 flex flex-col gap-1">
              {/* Stacked bars */}
              <div className="relative h-56 flex flex-col justify-end">
                <div
                  className="w-full bg-blue-500 rounded-t transition-all duration-300"
                  style={{ height: `${getBarHeight(point.commits)}%` }}
                  title={`Commits: ${point.commits}`}
                  role="img"
                  aria-label={`Week ${point.week}: ${point.commits} commits`}
                />
                <div
                  className="w-full bg-green-500 transition-all duration-300"
                  style={{ height: `${getBarHeight(point.prs)}%` }}
                  title={`PRs: ${point.prs}`}
                />
                <div
                  className="w-full bg-purple-500 transition-all duration-300"
                  style={{ height: `${getBarHeight(point.reviews)}%` }}
                  title={`Reviews: ${point.reviews}`}
                />
                <div
                  className="w-full bg-orange-500 rounded-b transition-all duration-300"
                  style={{ height: `${getBarHeight(point.issues)}%` }}
                  title={`Issues: ${point.issues}`}
                />
              </div>
              <p className="text-xs text-center text-default-500 truncate mt-1">{point.week}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data table for accessibility */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-default-600 dark:text-default-400">
          View data table
        </summary>
        <table className="w-full mt-2 text-sm">
          <thead>
            <tr>
              <th className="text-left">Week</th>
              <th className="text-right">Commits</th>
              <th className="text-right">PRs</th>
              <th className="text-right">Reviews</th>
              <th className="text-right">Issues</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point, index) => (
              <tr key={index} className="border-t border-default-200 dark:border-default-800">
                <td className="py-1">{point.week}</td>
                <td className="text-right">{point.commits}</td>
                <td className="text-right">{point.prs}</td>
                <td className="text-right">{point.reviews}</td>
                <td className="text-right">{point.issues}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
