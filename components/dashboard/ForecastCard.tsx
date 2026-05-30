'use client';

// components/dashboard/ForecastCard.tsx

import { motion } from 'framer-motion';
import { TrendingUp, CalendarDays, Target, BarChart2 } from 'lucide-react';
import type { ForecastData } from '@/types/dashboard';

interface ForecastCardProps {
  forecast: ForecastData;
}

/**
 * Renders a compact contribution forecast card for the dashboard right sidebar.
 *
 * Visual sections:
 *   1. Next-7-day mini bar chart with day labels and predicted counts.
 *   2. End-of-month projection with an inline progress bar.
 *   3. Year-end projection.
 *
 * Styling deliberately mirrors the existing StatsCard / AIInsights aesthetic:
 *   - rounded-xl, bg-white dark:bg-[#0a0a0a], border border-black/10 dark:border-[rgba(255,255,255,0.08)]
 *   - Framer Motion whileInView + whileHover
 *   - Lucide icons, text-[#A1A1AA] muted labels
 */
export default function ForecastCard({ forecast }: ForecastCardProps) {
  const {
    next7Days,
    endOfMonthProjection,
    yearEndProjection,
    dailyAverage,
    currentMonthActual,
    daysLeftInMonth,
    yearToDateActual,
  } = forecast;

  // ── Bar chart scale ────────────────────────────────────────────────────────
  const maxPredicted = Math.max(...next7Days.map((d) => d.predicted), 1);

  // ── Month progress: how much of the month's projection is already done ─────
  const monthProgressPct =
    endOfMonthProjection > 0
      ? Math.min(100, Math.round((currentMonthActual / endOfMonthProjection) * 100))
      : 0;

  // ── Year progress ─────────────────────────────────────────────────────────
  const yearProgressPct =
    yearEndProjection > 0
      ? Math.min(100, Math.round((yearToDateActual / yearEndProjection) * 100))
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="group p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.14)] hover:shadow-[0_0_24px_rgba(99,102,241,0.08)] transition-all duration-200 relative overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 mb-5">
        <TrendingUp size={15} className="text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
          Activity Forecast
        </h3>
        <span className="ml-auto text-[10px] font-medium text-[#71717A] bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded-full">
          ~{dailyAverage}/day avg
        </span>
      </div>

      {/* ── Section 1: Next 7 Days bar chart ──────────────────────────────── */}
      <div className="mb-5">
        <p className="text-[10px] font-medium text-[#A1A1AA] uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <BarChart2 size={11} />
          Next 7 Days
        </p>

        <div className="flex items-end gap-1 h-16">
          {next7Days.map((day, i) => {
            const barHeightPct = maxPredicted > 0 ? (day.predicted / maxPredicted) * 100 : 0;
            // Animate bars in with a staggered delay
            return (
              <motion.div
                key={day.date}
                initial={{ scaleY: 0, opacity: 0 }}
                whileInView={{ scaleY: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * i, duration: 0.3, ease: 'easeOut' }}
                style={{ originY: 1 }}
                className="flex-1 flex flex-col items-center gap-1 justify-end h-full"
              >
                {/* Predicted count label — only show if non-zero */}
                <span className="text-[8px] text-[#71717A] leading-none">
                  {day.predicted > 0 ? day.predicted : ''}
                </span>

                {/* Bar */}
                <div
                  className="w-full rounded-t-[2px] bg-black dark:bg-white opacity-50 dark:opacity-30 group-hover:opacity-80 dark:group-hover:opacity-60 transition-opacity duration-300"
                  style={{ height: `${Math.max(barHeightPct, 4)}%` }}
                />

                {/* Day label */}
                <span className="text-[9px] text-[#71717A] leading-none mt-0.5">
                  {day.dayLabel}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-black/5 dark:border-white/5 mb-5" />

      {/* ── Section 2: Month-end projection ───────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium text-[#A1A1AA] uppercase tracking-widest flex items-center gap-1.5">
            <CalendarDays size={11} />
            Month-End
          </p>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {currentMonthActual.toLocaleString()}
            <span className="text-[#A1A1AA] font-normal"> → </span>
            {endOfMonthProjection.toLocaleString()}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 dark:bg-[#111] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${monthProgressPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
            className="h-full bg-black dark:bg-white opacity-70 dark:opacity-50 rounded-full"
          />
        </div>
        <p className="text-[10px] text-[#71717A] mt-1">
          {daysLeftInMonth} day{daysLeftInMonth !== 1 ? 's' : ''} remaining · {monthProgressPct}%
          complete
        </p>
      </div>

      {/* ── Section 3: Year-end projection ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium text-[#A1A1AA] uppercase tracking-widest flex items-center gap-1.5">
            <Target size={11} />
            Year-End
          </p>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {yearToDateActual.toLocaleString()}
            <span className="text-[#A1A1AA] font-normal"> → </span>
            {yearEndProjection.toLocaleString()}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 dark:bg-[#111] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${yearProgressPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
            className="h-full bg-black dark:bg-white opacity-70 dark:opacity-50 rounded-full"
          />
        </div>
        <p className="text-[10px] text-[#71717A] mt-1">{yearProgressPct}% of year-end pace</p>
      </div>

      {/* Subtle disclaimer */}
      <p className="text-[9px] text-[#52525B] mt-4 leading-relaxed">
        ✦ Forecast uses weighted trend analysis on your historical data. No AI APIs.
      </p>
    </motion.div>
  );
}
