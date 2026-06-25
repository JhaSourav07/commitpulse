'use client';

// components/dashboard/VelocitySummaryCard.tsx
// KPI Summary Card for Velocity Dashboard

interface VelocitySummaryCardProps {
  label: string;
  value: number;
  suffix?: string;
  trend?: number;
  icon?: string;
}

export default function VelocitySummaryCard({
  label,
  value,
  suffix = '',
  trend,
  icon = '📊',
}: VelocitySummaryCardProps) {
  const isPositiveTrend = trend && trend > 0;
  const isNegativeTrend = trend && trend < 0;

  return (
    <article
      className="bg-default-50 dark:bg-default-900 rounded-lg p-4 border border-default-200 dark:border-default-800"
      role="figure"
      aria-label={`${label}: ${value}${suffix}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-default-600 dark:text-default-400">{label}</p>
          <p className="text-2xl font-bold mt-1">
            <span aria-live="polite">{Math.round(value * 10) / 10}</span>
            <span className="text-sm font-normal text-default-500 ml-1">{suffix}</span>
          </p>
        </div>
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
      </div>
      {trend !== undefined && (
        <div className="mt-2">
          <span
            className={`inline-flex items-center text-sm font-medium ${
              isPositiveTrend
                ? 'text-green-600 dark:text-green-400'
                : isNegativeTrend
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-default-500'
            }`}
            aria-label={`Trend: ${trend > 0 ? 'increase' : trend < 0 ? 'decrease' : 'no change'} ${Math.abs(trend)}%`}
          >
            {isPositiveTrend && '↑'}
            {isNegativeTrend && '↓'}
            {!isPositiveTrend && !isNegativeTrend && '→'}
            <span className="ml-1">{Math.abs(trend)}%</span>
          </span>
        </div>
      )}
    </article>
  );
}
