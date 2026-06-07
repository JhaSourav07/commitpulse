'use client';

import { useMemo, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Flame } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ActivityData } from '@/types/dashboard';
import Heatmap from './Heatmap';
import {
  dashboardPeriodToSearchParams,
  resolveDashboardPeriod,
  shiftDashboardPeriod,
  type DashboardPeriod,
} from '@/utils/dashboardPeriod';

interface HistoricalTrendViewProps {
  username: string;
  activity: ActivityData[];
  period: DashboardPeriod;
}

function formatDateInput(value: string): string {
  return value.slice(0, 10);
}

function buildMonthBuckets(activity: ActivityData[]) {
  const buckets = new Map<string, number>();

  for (const day of activity) {
    const key = day.date.slice(0, 7);
    buckets.set(key, (buckets.get(key) || 0) + day.count);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      const date = new Date(`${key}-01T00:00:00Z`);
      return {
        key,
        label: new Intl.DateTimeFormat('en-US', {
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(date),
        count,
      };
    });
}

function buildYearBuckets(activity: ActivityData[]) {
  const buckets = new Map<string, number>();

  for (const day of activity) {
    const key = day.date.slice(0, 4);
    buckets.set(key, (buckets.get(key) || 0) + day.count);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({ key, label: key, count }));
}

function calculateStreakSeries(activity: ActivityData[]) {
  const series: number[] = [];
  let current = 0;

  for (const day of activity) {
    if (day.count > 0) {
      current += 1;
    } else {
      current = 0;
    }

    series.push(current);
  }

  return series;
}

function formatAverage(total: number, days: number): string {
  if (days === 0) return '0';
  return (total / days).toFixed(1);
}

export default function HistoricalTrendView({
  username,
  activity,
  period,
}: HistoricalTrendViewProps) {
  const router = useRouter();
  const periodKey = `${period.kind}:${period.month ?? period.year ?? period.from}:${period.to}`;

  const totalContributions = useMemo(
    () => activity.reduce((sum, day) => sum + day.count, 0),
    [activity]
  );
  const activeDays = useMemo(() => activity.filter((day) => day.count > 0).length, [activity]);
  const peakDay = useMemo(
    () =>
      activity.reduce(
        (best, day) => (day.count > best.count ? day : best),
        activity[0] ?? { date: '', count: 0 }
      ),
    [activity]
  );
  const monthBuckets = useMemo(() => buildMonthBuckets(activity), [activity]);
  const yearBuckets = useMemo(() => buildYearBuckets(activity), [activity]);
  const streakSeries = useMemo(() => calculateStreakSeries(activity), [activity]);
  const longestStreak = useMemo(
    () => streakSeries.reduce((max, streak) => Math.max(max, streak), 0),
    [streakSeries]
  );
  const currentStreak = streakSeries.at(-1) ?? 0;
  const maxSeries = Math.max(...streakSeries, 1);
  const sparklinePoints = streakSeries
    .map((value, index) => {
      const x = streakSeries.length <= 1 ? 0 : (index / (streakSeries.length - 1)) * 100;
      const y = 100 - (value / maxSeries) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const periodSummary = `${period.label} · ${activity.length} days`;

  const navigateToPeriod = (nextPeriod: DashboardPeriod) => {
    const params = dashboardPeriodToSearchParams(nextPeriod);
    router.push(`/dashboard/${username}?${params.toString()}`);
  };

  const handleShift = (direction: 'prev' | 'next') => {
    navigateToPeriod(shiftDashboardPeriod(period, direction));
  };

  const handleMonthSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const monthValue = String(formData.get('month') ?? '').trim();
    if (!monthValue) return;
    navigateToPeriod(resolveDashboardPeriod({ month: monthValue }));
  };

  const handleYearSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const yearValue = String(formData.get('year') ?? '').trim();
    if (!yearValue) return;
    navigateToPeriod(resolveDashboardPeriod({ year: yearValue }));
  };

  const handleRangeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rangeFrom = String(formData.get('from') ?? '').trim();
    const rangeTo = String(formData.get('to') ?? '').trim();
    if (!rangeFrom || !rangeTo) return;
    navigateToPeriod(
      resolveDashboardPeriod({
        from: `${rangeFrom}T00:00:00.000Z`,
        to: `${rangeTo}T23:59:59.999Z`,
      })
    );
  };

  return (
    <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#0a0a0a]">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">
            <CalendarDays size={12} /> Historical Trend View
          </p>
          <h3 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
            Explore long-term activity patterns across months and years
          </h3>
          <p className="mt-1 text-xs text-[#A1A1AA]">{periodSummary}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleShift('prev')}
            className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-[rgba(255,255,255,0.08)] dark:text-white dark:hover:bg-white/5"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <button
            type="button"
            onClick={() => handleShift('next')}
            className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-[rgba(255,255,255,0.08)] dark:text-white dark:hover:bg-white/5"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-gray-50 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111]">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#A1A1AA]">Contributions</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {totalContributions}
          </p>
          <p className="mt-1 text-xs text-[#A1A1AA]">Total in selected period</p>
          <p className="mt-2 text-xs text-[#A1A1AA]">
            Peak day: {peakDay.date ? `${peakDay.date} (${peakDay.count})` : 'n/a'}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 bg-gray-50 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111]">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#A1A1AA]">Active Days</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{activeDays}</p>
          <p className="mt-1 text-xs text-[#A1A1AA]">Days with at least one contribution</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-gray-50 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111]">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#A1A1AA]">Current Streak</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-gray-900 dark:text-white">
            <Flame size={22} className="text-emerald-500" />
            {currentStreak}
          </p>
          <p className="mt-1 text-xs text-[#A1A1AA]">Based on the selected activity window</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-gray-50 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111]">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#A1A1AA]">Longest Streak</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {longestStreak}
          </p>
          <p className="mt-1 text-xs text-[#A1A1AA]">Peak run inside this period</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
                Streak Trend
              </h4>
              <p className="text-xs text-[#A1A1AA]">
                Daily streak length across the selected period
              </p>
            </div>
            <p className="text-xs font-medium text-[#A1A1AA]">
              Avg/day {formatAverage(totalContributions, activity.length)}
            </p>
          </div>

          <div className="rounded-xl border border-black/10 bg-gray-50 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111]">
            {streakSeries.length > 0 ? (
              <svg data-testid="streak-sparkline" viewBox="0 0 100 100" className="h-40 w-full">
                <defs>
                  <linearGradient id="streak-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="url(#streak-gradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparklinePoints}
                />
              </svg>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-[#A1A1AA]">
                No streak data available for this period
              </div>
            )}
          </div>
        </div>

        <div key={periodKey} className="space-y-4">
          <form
            onSubmit={handleMonthSubmit}
            className="rounded-xl border border-black/10 bg-gray-50 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A1A1AA]">
              Pick Month
            </p>
            <div className="mt-3 flex gap-2">
              <input
                name="month"
                type="month"
                defaultValue={period.kind === 'month' && period.month ? period.month : ''}
                className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-emerald-500 dark:border-[rgba(255,255,255,0.08)] dark:bg-black/30 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
              >
                Go
              </button>
            </div>
          </form>

          <form
            onSubmit={handleYearSubmit}
            className="rounded-xl border border-black/10 bg-gray-50 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A1A1AA]">
              Pick Year
            </p>
            <div className="mt-3 flex gap-2">
              <input
                name="year"
                type="number"
                min="2008"
                max={new Date().getUTCFullYear() + 5}
                defaultValue={period.kind === 'year' && period.year ? period.year : ''}
                className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-emerald-500 dark:border-[rgba(255,255,255,0.08)] dark:bg-black/30 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
              >
                Go
              </button>
            </div>
          </form>

          <form
            onSubmit={handleRangeSubmit}
            className="rounded-xl border border-black/10 bg-gray-50 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A1A1AA]">
              Custom Range
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                name="from"
                type="date"
                defaultValue={formatDateInput(period.from)}
                className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-emerald-500 dark:border-[rgba(255,255,255,0.08)] dark:bg-black/30 dark:text-white"
              />
              <input
                name="to"
                type="date"
                defaultValue={formatDateInput(period.to)}
                className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-emerald-500 dark:border-[rgba(255,255,255,0.08)] dark:bg-black/30 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="mt-3 w-full rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
            >
              Apply Range
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
            Monthly Summary
          </h4>
          <div className="space-y-2 rounded-xl border border-black/10 bg-gray-50 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111]">
            {monthBuckets.length > 0 ? (
              monthBuckets.map((bucket) => (
                <div key={bucket.key} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-[#A1A1AA]">{bucket.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                      style={{
                        width: `${Math.max(8, (bucket.count / Math.max(...monthBuckets.map((item) => item.count), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs font-semibold text-gray-900 dark:text-white">
                    {bucket.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#A1A1AA]">No monthly breakdown available.</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
            Yearly Summary
          </h4>
          <div className="space-y-2 rounded-xl border border-black/10 bg-gray-50 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111]">
            {yearBuckets.length > 0 ? (
              yearBuckets.map((bucket) => (
                <div key={bucket.key} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs text-[#A1A1AA]">{bucket.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                      style={{
                        width: `${Math.max(8, (bucket.count / Math.max(...yearBuckets.map((item) => item.count), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs font-semibold text-gray-900 dark:text-white">
                    {bucket.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#A1A1AA]">No yearly breakdown available.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Heatmap
          data={activity}
          title="Historical Heatmap"
          subtitle={period.label}
          emptyMessage="No activity found for this period"
        />
      </div>
    </section>
  );
}
