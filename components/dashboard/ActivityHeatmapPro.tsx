'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  Sun,
  Moon,
  Sunrise,
  Sunset,
} from 'lucide-react';

interface ActivityHeatmapProProps {
  activity: Array<{ date: string; count: number; intensity: 0 | 1 | 2 | 3 | 4 }>;
  commitClock?: Array<{ day: string; commits: number }>;
}

type ViewMode = 'heatmap' | 'hourly' | 'weekly' | 'monthly';

const intensityColors = [
  'bg-gray-100 dark:bg-white/5',
  'bg-emerald-200 dark:bg-emerald-900/50',
  'bg-emerald-400 dark:bg-emerald-700/60',
  'bg-emerald-500 dark:bg-emerald-500/70',
  'bg-emerald-700 dark:bg-emerald-400/80',
];

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getTimeOfDayIcon(hour: number) {
  if (hour >= 5 && hour < 12) return <Sunrise size={14} className="text-amber-500" />;
  if (hour >= 12 && hour < 17) return <Sun size={14} className="text-yellow-500" />;
  if (hour >= 17 && hour < 21) return <Sunset size={14} className="text-orange-500" />;
  return <Moon size={14} className="text-indigo-400" />;
}

export default function ActivityHeatmapPro({ activity, commitClock }: ActivityHeatmapProProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');

  // Compute weekly pattern from activity
  const weeklyPattern = useMemo(() => {
    const dayCounts: Record<string, { total: number; count: number }> = {};
    dayLabels.forEach((d) => (dayCounts[d] = { total: 0, count: 0 }));

    activity.forEach((a) => {
      const date = new Date(a.date);
      const dayName = dayLabels[date.getDay()];
      if (dayCounts[dayName]) {
        dayCounts[dayName].total += a.count;
        dayCounts[dayName].count += 1;
      }
    });

    return dayLabels.map((day) => ({
      day,
      total: dayCounts[day].total,
      average:
        dayCounts[day].count > 0 ? Math.round(dayCounts[day].total / dayCounts[day].count) : 0,
    }));
  }, [activity]);

  // Monthly aggregation
  const monthlyData = useMemo(() => {
    const months: Record<string, { total: number; days: number }> = {};

    activity.forEach((a) => {
      const monthKey = a.date.slice(0, 7); // YYYY-MM
      if (!months[monthKey]) months[monthKey] = { total: 0, days: 0 };
      months[monthKey].total += a.count;
      months[monthKey].days += 1;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, val]) => {
        const [year, month] = key.split('-');
        return {
          label: `${monthLabels[parseInt(month) - 1]} ${year.slice(2)}`,
          total: val.total,
          average: Math.round(val.total / val.days),
          days: val.days,
        };
      });
  }, [activity]);

  // Peak activity stats
  const stats = useMemo(() => {
    if (activity.length === 0)
      return { total: 0, peak: 0, peakDate: '', average: 0, activeDays: 0 };
    const total = activity.reduce((sum, a) => sum + a.count, 0);
    const activeDays = activity.filter((a) => a.count > 0).length;
    const peak = Math.max(...activity.map((a) => a.count));
    const peakDate = activity.find((a) => a.count === peak)?.date || '';
    return {
      total,
      peak,
      peakDate,
      average: activeDays > 0 ? Math.round(total / activeDays) : 0,
      activeDays,
    };
  }, [activity]);

  // Hourly distribution (simulated from commitClock or activity patterns)
  const hourlyData = useMemo(() => {
    if (commitClock && commitClock.length > 0) {
      return commitClock.map((c, i) => ({
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`,
        commits: c.commits,
      }));
    }
    // Simulate hourly pattern from activity intensity
    return Array.from({ length: 24 }, (_, i) => {
      const pseudoRandom = ((i * 1867 + stats.average * 997) % 100) / 100;
      return {
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`,
        commits: Math.round(pseudoRandom * stats.average * 2),
      };
    });
  }, [commitClock, stats.average]);

  const maxHourly = Math.max(...hourlyData.map((h) => h.commits), 1);
  const maxMonthly = Math.max(...monthlyData.map((m) => m.total), 1);
  const maxWeekly = Math.max(...weeklyPattern.map((w) => w.total), 1);

  const views: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: 'heatmap', label: 'Heatmap', icon: <Calendar size={14} /> },
    { key: 'hourly', label: 'Hourly', icon: <Clock size={14} /> },
    { key: 'weekly', label: 'Weekly', icon: <BarChart3 size={14} /> },
    { key: 'monthly', label: 'Monthly', icon: <TrendingUp size={14} /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-black/10 bg-white/80 backdrop-blur-xl p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(17,17,17,0.8)]"
      role="region"
      aria-label="Activity Heatmap Pro"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20">
            <Activity className="text-emerald-500" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black dark:text-white">Activity Pro</h3>
            <p className="text-xs text-gray-500 dark:text-white/50">
              {stats.activeDays} active days · {stats.total.toLocaleString()} contributions
            </p>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-black/5 dark:bg-white/5">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => setViewMode(v.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex-1 justify-center ${
              viewMode === v.key
                ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'
            }`}
          >
            {v.icon}
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total.toLocaleString(), color: 'text-emerald-500' },
          { label: 'Peak', value: stats.peak.toString(), color: 'text-amber-500' },
          { label: 'Daily Avg', value: stats.average.toString(), color: 'text-blue-500' },
          { label: 'Active Days', value: stats.activeDays.toString(), color: 'text-purple-500' },
        ].map((s) => (
          <div
            key={s.label}
            className="text-center p-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.03]"
          >
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-wider">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {viewMode === 'heatmap' && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="overflow-x-auto">
              <div
                className="grid gap-[3px]"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(52, Math.ceil(activity.length / 7))}, 1fr)`,
                }}
              >
                {activity.slice(-364).map((a) => (
                  <div
                    key={a.date}
                    className={`w-3 h-3 rounded-[2px] ${intensityColors[a.intensity]} transition-all duration-150 hover:ring-2 hover:ring-emerald-500/50 cursor-pointer`}
                    title={`${a.date}: ${a.count} contributions`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 mt-2">
              <span className="text-[10px] text-gray-500 dark:text-white/40 mr-1">Less</span>
              {intensityColors.map((color, i) => (
                <div key={i} className={`w-3 h-3 rounded-[2px] ${color}`} />
              ))}
              <span className="text-[10px] text-gray-500 dark:text-white/40 ml-1">More</span>
            </div>
          </motion.div>
        )}

        {viewMode === 'hourly' && (
          <motion.div
            key="hourly"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
              {hourlyData.map((h) => {
                const height = (h.commits / maxHourly) * 100;
                return (
                  <div key={h.hour} className="flex flex-col items-center gap-1">
                    <div className="w-full h-16 flex items-end justify-center">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 4)}%` }}
                        transition={{ duration: 0.5, delay: h.hour * 0.02 }}
                        className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-400 min-h-[2px]"
                      />
                    </div>
                    <div className="flex items-center gap-0.5">{getTimeOfDayIcon(h.hour)}</div>
                    <span className="text-[9px] text-gray-500 dark:text-white/40">{h.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              {['Morning', 'Afternoon', 'Evening', 'Night'].map((period, i) => (
                <div key={period} className="flex items-center gap-1">
                  {getTimeOfDayIcon([8, 14, 19, 1][i])}
                  <span className="text-[10px] text-gray-500 dark:text-white/40">{period}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {viewMode === 'weekly' && (
          <motion.div
            key="weekly"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {weeklyPattern.map((w, i) => {
              const width = (w.total / maxWeekly) * 100;
              return (
                <div key={w.day} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-500 dark:text-white/50 w-8">
                    {w.day}
                  </span>
                  <div className="flex-1 h-6 bg-black/[0.03] dark:bg-white/[0.03] rounded-md overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(width, 2)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      className="h-full rounded-md bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-end px-2"
                    >
                      {width > 15 && (
                        <span className="text-[10px] font-semibold text-white">{w.total}</span>
                      )}
                    </motion.div>
                  </div>
                  {width <= 15 && (
                    <span className="text-xs text-gray-500 dark:text-white/40 w-8">{w.total}</span>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {viewMode === 'monthly' && (
          <motion.div
            key="monthly"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-end gap-1 h-32">
              {monthlyData.map((m, i) => {
                const height = (m.total / maxMonthly) * 100;
                return (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-gray-500 dark:text-white/40 font-medium">
                      {m.total}
                    </span>
                    <div
                      className="w-full flex items-end justify-center"
                      style={{ height: '100px' }}
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 3)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.04 }}
                        className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-teal-400 dark:from-emerald-600 dark:to-teal-400"
                      />
                    </div>
                    <span className="text-[9px] text-gray-500 dark:text-white/40 font-medium">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
