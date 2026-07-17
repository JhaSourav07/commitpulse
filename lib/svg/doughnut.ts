// lib/svg/doughnut.ts

import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';
import { truncateUsername, getSizeScale } from './generator';
import { escapeXML, sanitizeRadius } from './sanitizer';

const DOUGHNUT_SVG_WIDTH = 400;
const DOUGHNUT_SVG_HEIGHT = 200;
const DOUGHNUT_CENTER_X = 140;
const DOUGHNUT_CENTER_Y = 100;
const OUTER_RADIUS = 70;
const INNER_RADIUS_DOUGHNUT = 40;
const INNER_RADIUS_PIE = 0;

function getCoordinates(percent: number, radius: number, cx: number, cy: number) {
  const x = cx + Math.cos(2 * Math.PI * percent - Math.PI / 2) * radius;
  const y = cy + Math.sin(2 * Math.PI * percent - Math.PI / 2) * radius;
  return [x, y];
}

function createSlice(
  percentValue: number,
  cumulativePercent: number,
  outerRadius: number,
  innerRadius: number,
  cx: number,
  cy: number
): string {
  // If the slice is exactly 100%, we draw two semi-circles as an arc can't be a full circle easily.
  if (percentValue >= 1) {
    if (innerRadius === 0) {
      return `M ${cx - outerRadius} ${cy}
              A ${outerRadius} ${outerRadius} 0 1 1 ${cx + outerRadius} ${cy}
              A ${outerRadius} ${outerRadius} 0 1 1 ${cx - outerRadius} ${cy} Z`;
    } else {
      return `M ${cx - outerRadius} ${cy}
              A ${outerRadius} ${outerRadius} 0 1 1 ${cx + outerRadius} ${cy}
              A ${outerRadius} ${outerRadius} 0 1 1 ${cx - outerRadius} ${cy}
              Z
              M ${cx - innerRadius} ${cy}
              A ${innerRadius} ${innerRadius} 0 1 0 ${cx + innerRadius} ${cy}
              A ${innerRadius} ${innerRadius} 0 1 0 ${cx - innerRadius} ${cy} Z`;
    }
  }

  const [startX, startY] = getCoordinates(cumulativePercent, outerRadius, cx, cy);
  const [endX, endY] = getCoordinates(cumulativePercent + percentValue, outerRadius, cx, cy);

  const largeArcFlag = percentValue > 0.5 ? 1 : 0;

  if (innerRadius === 0) {
    return `M ${cx} ${cy}
            L ${startX} ${startY}
            A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}
            Z`;
  }

  const [innerStartX, innerStartY] = getCoordinates(cumulativePercent, innerRadius, cx, cy);
  const [innerEndX, innerEndY] = getCoordinates(
    cumulativePercent + percentValue,
    innerRadius,
    cx,
    cy
  );

  return `M ${startX} ${startY}
          A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}
          L ${innerEndX} ${innerEndY}
          A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}
          Z`;
}

export function generateDoughnutSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  const sf = getSizeScale(params.size);
  const safeUser = escapeXML(truncateUsername(params.user));
  const bgColor = params.bg || '0d1117';
  const textColor = params.text || 'c9d1d9';

  // Use user's accent colors, fallback to a nice palette
  const accents = Array.isArray(params.accent)
    ? params.accent
    : [params.accent || '58a6ff', 'ff7b72', '3fb950', 'd2a8ff'];

  const colorWeekday = accents[0];
  const colorWeekend = accents.length > 1 ? accents[1] : 'ff7b72';

  let weekendCommits = 0;
  let weekdayCommits = 0;

  calendar.weeks.forEach((week) => {
    week.contributionDays.forEach((day) => {
      if (day.contributionCount > 0) {
        // Parse date carefully to avoid timezone issues
        const d = new Date(`${day.date}T12:00:00Z`);
        const dayOfWeek = d.getUTCDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          weekendCommits += day.contributionCount;
        } else {
          weekdayCommits += day.contributionCount;
        }
      }
    });
  });

  const totalCommits = weekendCommits + weekdayCommits;
  const weekendPercent = totalCommits > 0 ? weekendCommits / totalCommits : 0;
  const weekdayPercent = totalCommits > 0 ? weekdayCommits / totalCommits : 0;

  const innerRadius = params.view === 'pie' ? INNER_RADIUS_PIE : INNER_RADIUS_DOUGHNUT;

  let slicesSVG = '';

  if (totalCommits === 0) {
    // Render a placeholder if no commits
    slicesSVG = `<circle cx="${DOUGHNUT_CENTER_X}" cy="${DOUGHNUT_CENTER_Y}" r="${OUTER_RADIUS}" fill="none" stroke="#${textColor}" stroke-width="2" opacity="0.2" />`;
    if (innerRadius > 0) {
      slicesSVG += `<circle cx="${DOUGHNUT_CENTER_X}" cy="${DOUGHNUT_CENTER_Y}" r="${innerRadius}" fill="#${bgColor}" />`;
    }
  } else {
    // Draw slices
    // Slice 1: Weekday
    if (weekdayPercent > 0) {
      slicesSVG += `\n    <path d="${createSlice(weekdayPercent, 0, OUTER_RADIUS, innerRadius, DOUGHNUT_CENTER_X, DOUGHNUT_CENTER_Y)}" fill="#${colorWeekday}" />`;
    }
    // Slice 2: Weekend
    if (weekendPercent > 0) {
      slicesSVG += `\n    <path d="${createSlice(weekendPercent, weekdayPercent, OUTER_RADIUS, innerRadius, DOUGHNUT_CENTER_X, DOUGHNUT_CENTER_Y)}" fill="#${colorWeekend}" />`;
    }
  }

  // Legend and text
  const viewTitle = params.view === 'pie' ? 'Pie Chart' : 'Doughnut Chart';

  const weekendStr = (weekendPercent * 100).toFixed(1) + '%';
  const weekdayStr = (weekdayPercent * 100).toFixed(1) + '%';

  // Validate the corner radius before interpolation into SVG attributes
  const safeRadius = sanitizeRadius(params.radius, 8);

  return `<svg style="max-width: 100%; height: auto;" xmlns="http://www.w3.org/2000/svg" width="${Math.round(DOUGHNUT_SVG_WIDTH * sf)}" height="${Math.round(DOUGHNUT_SVG_HEIGHT * sf)}" viewBox="0 0 ${DOUGHNUT_SVG_WIDTH} ${DOUGHNUT_SVG_HEIGHT}" role="img" aria-labelledby="cp-doughnut-title cp-doughnut-desc">
  <title id="cp-doughnut-title">CommitPulse ${viewTitle} for ${safeUser}</title>
  <desc id="cp-doughnut-desc">A ${viewTitle.toLowerCase()} showing weekday vs weekend commits for ${safeUser}.</desc>
  <defs>
    <style>
      .title { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 16px; fill: #${textColor}; }
      .subtitle { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 12px; fill: #${textColor}; opacity: 0.7; }
      .legend-text { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13px; fill: #${textColor}; }
      .legend-sub { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 11px; fill: #${textColor}; opacity: 0.6; }
    </style>
  </defs>

  <rect width="${DOUGHNUT_SVG_WIDTH}" height="${DOUGHNUT_SVG_HEIGHT}" fill="#${bgColor}" rx="${safeRadius}" />
  
  <g id="chart">
${slicesSVG}
  </g>
  
  <g transform="translate(240, 60)">
    <text x="0" y="0" class="title">${safeUser}</text>
    <text x="0" y="16" class="subtitle">Weekday vs Weekend</text>
    
    <rect x="0" y="40" width="12" height="12" rx="2" fill="#${colorWeekday}" />
    <text x="20" y="50" class="legend-text">Weekday</text>
    <text x="140" y="50" class="legend-text" text-anchor="end">${weekdayStr}</text>
    <text x="20" y="66" class="legend-sub">${weekdayCommits.toLocaleString()} commits</text>
    
    <rect x="0" y="86" width="12" height="12" rx="2" fill="#${colorWeekend}" />
    <text x="20" y="96" class="legend-text">Weekend</text>
    <text x="140" y="96" class="legend-text" text-anchor="end">${weekendStr}</text>
    <text x="20" y="112" class="legend-sub">${weekendCommits.toLocaleString()} commits</text>
  </g>
</svg>`;
}
