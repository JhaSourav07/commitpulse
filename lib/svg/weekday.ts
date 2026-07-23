// lib/svg/weekday.ts

import type { BadgeParams, ContributionCalendar, StreakStats } from '@/types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeekdayBucket {
  day: string;
  total: number;
  average: number;
}

/**
 * Groups a contribution calendar's daily counts into 7 buckets (Sun–Sat).
 *
 * Note: we derive the weekday from `day.date` rather than the day's position
 * within `week.contributionDays` (even though weeks are stored Sun→Sat).
 * This keeps the grouping correct for partial weeks — e.g. when a `year`
 * or `from`/`to` range slices a calendar starting or ending mid-week.
 */
function groupByWeekday(calendar: ContributionCalendar): WeekdayBucket[] {
  const totals = new Array(7).fill(0);
  const dayCounts = new Array(7).fill(0);

  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      // day.date is 'YYYY-MM-DD' (confirmed in ContributionDay)
      const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
      totals[weekday] += day.contributionCount;
      dayCounts[weekday] += 1;
    }
  }

  return DAY_LABELS.map((label, i) => ({
    day: label,
    total: totals[i],
    average: dayCounts[i] ? totals[i] / dayCounts[i] : 0,
  }));
}

/**
 * Renders a "Weekday Rhythm" bar chart SVG — one bar per day of the week,
 * showing total contributions made on that weekday over the queried period.
 * The highest bar (the user's "peak day") is highlighted in the accent color.
 */
export function generateWeekdaySVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  let grouped = groupByWeekday(calendar);

  if (params.hide_weekend) {
    // Keep only Mon-Fri
    grouped = grouped.filter((d, i) => i !== 0 && i !== 6);
  }

  const max = Math.max(...grouped.map((d) => d.total), 1);
  const peakIndex = grouped.reduce((best, d, i, arr) => (d.total > arr[best].total ? i : best), 0);

  const width = params.width ?? 600;
  const height = params.height ?? 300;
  const barWidth = 50;
  const gap = 20;
  // Reserve ~40px at the top for the contributions subtitle and ~40px at the
  // bottom for the day-of-week labels, leaving the remainder for bar height.
  const chartHeight = height - 80;
  const numBars = grouped.length;
  const startX = (width - (numBars * barWidth + (numBars - 1) * gap)) / 2;

  // params.accent can be HexColor | HexColor[] — normalize to a single color
  const accentColor = Array.isArray(params.accent)
    ? params.accent[params.accent.length - 1]
    : params.accent;

  const bars = grouped
    .map((d, i) => {
      const barHeight = (d.total / max) * chartHeight;
      const x = startX + i * (barWidth + gap);
      const y = height - 40 - barHeight;
      const fill = i === peakIndex ? `#${accentColor}` : `#${params.text}`;

      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(barHeight, 1)}"
              rx="4" fill="${fill}" opacity="${i === peakIndex ? 1 : 0.7}" />
        <text x="${x + barWidth / 2}" y="${height - 20}"
              text-anchor="middle" font-size="12" fill="#${params.text}">
          ${d.day}
        </text>
      `;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#${params.bg}" rx="${params.radius ?? 8}" />
    <text x="${width / 2}" y="24" text-anchor="middle" font-size="14" fill="#${params.text}">
      ${stats.totalContributions} contributions
    </text>
    ${bars}
  </svg>`;
}
