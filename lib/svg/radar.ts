// lib/svg/radar.ts

import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';
import { truncateUsername, getSizeScale } from './generator';
import { escapeXML } from './sanitizer';
import { calculateWrappedStats, calculateMonthlyStats } from '../calculate';
import {
  RADAR_SVG_WIDTH,
  RADAR_SVG_HEIGHT,
  RADAR_CENTER_X,
  RADAR_CENTER_Y,
  RADAR_RADIUS,
  RADAR_AXIS_COUNT,
  RADAR_LEVELS,
  CSS_PREFIX,
  RADAR_AXES,
  USERNAME_LABEL_X,
  USERNAME_LABEL_Y,
  SUBTITLE_X,
  SUBTITLE_Y,
  RADAR_GRID_OPACITY,
  RADAR_AXIS_OPACITY,
} from './radarConstants';

function calculateRadarMetrics(stats: StreakStats, calendar: ContributionCalendar): number[] {
  // 1. Consistency: current streak vs longest
  const consistency =
    stats.longestStreak > 0 ? Math.min(1, stats.currentStreak / stats.longestStreak) : 0;

  // 2. Volume: total contributions normalized (e.g. 1500 is 1.0)
  const volume = Math.min(1, stats.totalContributions / 1500);

  // 3. Weekend Activity: from wrapped stats
  const wrapped = calculateWrappedStats(calendar);
  const weekend = Math.min(1, wrapped.weekendRatio / 100);

  // 4. Night Owl proxy: ratio of weeknight (Mon–Thu) contributions to all weekday contributions.
  // GitHub's calendar has no hour data, but weeknight commits (Mon–Thu) are a real behavioral
  // signal for late-evening coding patterns versus weekend/Friday casual commits.
  const weeks = calendar.weeks || [];
  const allDays = weeks.flatMap((w) => w?.contributionDays || []).filter(Boolean);
  let weeknightCommits = 0;
  let weekdayCommits = 0;
  for (const day of allDays) {
    if (!day?.date) continue;
    const dow = new Date(day.date).getUTCDay(); // 0=Sun … 6=Sat
    const count = day.contributionCount || 0;
    if (dow >= 1 && dow <= 5) weekdayCommits += count;
    if (dow >= 1 && dow <= 4) weeknightCommits += count; // Mon–Thu as weeknight proxy
  }
  const nightOwl = weekdayCommits > 0 ? Math.min(1, weeknightCommits / weekdayCommits) : 0;

  // 5. Growth: using monthly delta
  const monthly = calculateMonthlyStats(calendar, 'UTC', new Date());
  let growth = 0.5; // neutral
  if (monthly.deltaPercentage !== null) {
    growth = Math.min(1, Math.max(0, 0.5 + monthly.deltaPercentage / 200));
  }

  // 6. Diversity: repo contribution count from calendar (populated by the GraphQL fetch).
  // Normalized against 20 repos as a reasonable "high diversity" ceiling.
  const diversity =
    typeof calendar.repoContributions === 'number' && calendar.repoContributions > 0
      ? Math.min(1, calendar.repoContributions / 20)
      : 0.3; // neutral fallback when repo data is unavailable

  return [consistency, volume, weekend, nightOwl, growth, diversity];
}

export function generateRadarSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  const sf = getSizeScale(params.size);
  const safeUser = escapeXML(truncateUsername(params.user));
  const bgColor = params.bg || '0d1117';
  const textColor = params.text || 'c9d1d9';
  const accentColor = Array.isArray(params.accent) ? params.accent[0] : params.accent || '58a6ff';

  const metrics = calculateRadarMetrics(stats, calendar);

  // Build SVG content

  // 1. Radar Levels (Concentric grids)
  let levelsSVG = '';
  for (let level = 1; level <= RADAR_LEVELS; level++) {
    const r = (RADAR_RADIUS / RADAR_LEVELS) * level;
    let points = '';
    for (let i = 0; i < RADAR_AXIS_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / RADAR_AXIS_COUNT - Math.PI / 2;
      const x = RADAR_CENTER_X + r * Math.cos(angle);
      const y = RADAR_CENTER_Y + r * Math.sin(angle);
      points += `${x},${y} `;
    }
    levelsSVG += `      <polygon points="${points.trim()}" fill="none" stroke="#${textColor}" stroke-width="0.5" opacity="${RADAR_GRID_OPACITY}" />\n`;
  }

  // 2. Radar Axes and Labels
  let axesSVG = '';
  let labelsSVG = '';
  for (let i = 0; i < RADAR_AXIS_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / RADAR_AXIS_COUNT - Math.PI / 2;
    const x = RADAR_CENTER_X + RADAR_RADIUS * Math.cos(angle);
    const y = RADAR_CENTER_Y + RADAR_RADIUS * Math.sin(angle);
    axesSVG += `      <line x1="${RADAR_CENTER_X}" y1="${RADAR_CENTER_Y}" x2="${x}" y2="${y}" stroke="#${textColor}" stroke-width="0.8" opacity="${RADAR_AXIS_OPACITY}" />\n`;

    // Label positioning
    const labelR = RADAR_RADIUS + 25;
    const labelX = RADAR_CENTER_X + labelR * Math.cos(angle);
    const labelY = RADAR_CENTER_Y + labelR * Math.sin(angle);
    labelsSVG += `      <text x="${labelX}" y="${labelY}" fill="#${textColor}" font-family="'Inter', sans-serif" font-size="11" font-weight="600" text-anchor="middle" dominant-baseline="central" opacity="0.8">${RADAR_AXES[i].label}</text>\n`;
  }

  // 3. Data Polygon
  let dataPoints = '';
  for (let i = 0; i < RADAR_AXIS_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / RADAR_AXIS_COUNT - Math.PI / 2;
    // ensure minimum size for visual appeal
    const val = Math.max(0.1, metrics[i]);
    const r = RADAR_RADIUS * val;
    const x = RADAR_CENTER_X + r * Math.cos(angle);
    const y = RADAR_CENTER_Y + r * Math.sin(angle);
    dataPoints += `${x},${y} `;
  }

  const dataPolygonSVG = `
    <g filter="url(#${CSS_PREFIX}-glow)">
      <polygon points="${dataPoints.trim()}" fill="#${accentColor}" fill-opacity="0.25" stroke="#${accentColor}" stroke-width="2" style="animation: ${CSS_PREFIX}-pulse 3s infinite alternate;" />
    </g>`;

  // CSS Animations
  const css = `
    @keyframes ${CSS_PREFIX}-pulse {
      0% { filter: drop-shadow(0 0 2px #${accentColor}); opacity: 0.9; }
      100% { filter: drop-shadow(0 0 8px #${accentColor}); opacity: 1; }
    }
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(RADAR_SVG_WIDTH * sf)}" height="${Math.round(RADAR_SVG_HEIGHT * sf)}" viewBox="0 0 ${RADAR_SVG_WIDTH} ${RADAR_SVG_HEIGHT}" role="img" aria-labelledby="cp-radar-title cp-radar-desc">
  <title id="cp-radar-title">CommitPulse Radar Map for ${safeUser}</title>
  <desc id="cp-radar-desc">A radar chart visualization of ${safeUser}'s GitHub contributions across 6 dimensions.</desc>
  <defs>
    <style>${css}</style>
    <filter id="${CSS_PREFIX}-glow">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>

  <rect width="${RADAR_SVG_WIDTH}" height="${RADAR_SVG_HEIGHT}" fill="#${bgColor}" rx="8" />
  
  <g id="${CSS_PREFIX}-levels">
${levelsSVG}  </g>
  <g id="${CSS_PREFIX}-axes">
${axesSVG}  </g>
  <g id="${CSS_PREFIX}-labels">
${labelsSVG}  </g>
  
  <g id="${CSS_PREFIX}-data">
${dataPolygonSVG}
  </g>
  
  <text x="${USERNAME_LABEL_X}" y="${USERNAME_LABEL_Y}" fill="#${textColor}" font-family="'Inter', 'Space Grotesk', sans-serif" font-size="18" font-weight="700">${safeUser}</text>
  <text x="${SUBTITLE_X}" y="${SUBTITLE_Y}" fill="#${textColor}" font-family="'Inter', sans-serif" font-size="12" opacity="0.5">Contribution Radar</text>
</svg>`;
}
