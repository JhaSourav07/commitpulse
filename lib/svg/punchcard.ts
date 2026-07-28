/**
 * lib/svg/punchcard.ts
 *
 * Renders a GitHub-style "punch card" SVG — an isometric grid where each cell
 * represents one hour of one day of the week (24 columns x 7 rows). The height
 * of each isometric "tower" scales with the commit count relative to the peak,
 * and the tower opacity reflects relative intensity. Hour labels (12a, 6a, 12p,
 * 6p) run along one diagonal; day-of-week labels (Mon-Sun) run along the other.
 *
 * The 24x7 grid uses a parallelogram layout derived from the tile half-width and
 * half-height (TILE_W_HALF, TILE_H_HALF). The grid origin is offset horizontally
 * so the full punch card is centered within the WIDTH canvas.
 *
 * @module
 */

import type { BadgeParams, StreakStats } from '../../types';
import { escapeXML, sanitizeHexColor } from './sanitizer';
import { truncateUsername, getSizeScale } from './generator';

/** SVG canvas width in viewBox units. Scaled by getSizeScale() at render time. */
const WIDTH = 800;

/** SVG canvas height in viewBox units. Scaled by getSizeScale() at render time. */
const HEIGHT = 400;

/**
 * Half-width of each isometric tile (from center to side edge).
 * Controls the horizontal spacing between hour columns.
 */
const TILE_W_HALF = 12;

/**
 * Half-height of each isometric tile (from center to top/bottom edge).
 * Controls the diagonal slope of both the hour and day axes.
 */
const TILE_H_HALF = 6.5;

/**
 * X coordinate of the grid's top-left corner anchor point.
 * Derived from WIDTH, TILE_W_HALF, and TILE_H_HALF to center the 24x7
 * parallelogram grid horizontally within the canvas.
 */
const ORIGIN_X = WIDTH / 2 - ((24 - 7) * TILE_W_HALF) / 2 - 20;

/** Y coordinate of the grid's top-left corner anchor point. */
const ORIGIN_Y = 160;

/**
 * Renders a GitHub-style punch card SVG for the given user.
 *
 * The punch card is an isometric 24x7 grid: rows represent days of the week
 * (Mon at the top, Sun at the bottom) and columns represent hours of the day
 * (12a at the left, 11 PM at the right). Each occupied cell is rendered as a
 * 3-face isometric tower whose height scales with `punchCardData[day][hour]`
 * relative to the peak value across the entire grid. The tower opacity scales
 * from 0.3 (low activity) to 1.0 (peak activity).
 *
 * @param punchCardData - A 7x24 matrix of commit counts where `punchCardData[day][hour]`
 *   is the number of commits on `dayNames[day]` during hour `hour` (0 = midnight).
 *   Days are ordered Mon (index 0) through Sun (index 6). All 168 cells must
 *   be present; missing data should be zero-filled.
 * @param stats - Streak statistics used to populate the total-commits counter.
 *   Requires `stats.totalContributions`.
 * @param params - Badge rendering parameters. Controls background, text color, accent
 *   color, size scale, corner radius, and visibility flags (hideBackground, hide_title,
 *   hide_stats, custom_title).
 * @returns A complete, self-contained SVG string. No external stylesheets are
 *   required; the Inter font is loaded via an @import inside the SVG.
 *
 * @remarks
 * The painter's algorithm renders days back-to-front (day 0 first, day 6 last) so
 * that towers on later days overlap those on earlier days correctly.
 *
 * @example
 * ```ts
 * const data: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
 * data[1][10] = 5; // 5 commits on Tuesday at 10 AM
 * const svg = generatePunchcardSVG(data, { totalContributions: 5 }, {});
 * ```
 */
export function generatePunchcardSVG(
  punchCardData: number[][],
  stats: StreakStats,
  params: BadgeParams
): string {
  const sf = getSizeScale(params.size);
  const safeUser = escapeXML(truncateUsername(params.user));
  const bg = sanitizeHexColor(params.bg, '0d1117');
  const text = sanitizeHexColor(Array.isArray(params.accent) ? undefined : params.text, 'c9d1d9');
  const accent = sanitizeHexColor(
    Array.isArray(params.accent) ? params.accent[params.accent.length - 1] : params.accent,
    '58a6ff'
  );

  let maxCount = 1;
  for (const day of punchCardData) {
    for (const count of day) {
      if (count > maxCount) maxCount = count;
    }
  }

  let towers = '';
  // Iterate in back-to-front painter's algorithm order for isometric
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const count = punchCardData[day][hour];
      if (count === 0) continue;

      const ratio = count / maxCount;
      const h = 4 + ratio * 46;

      const px = ORIGIN_X + (hour - day) * TILE_W_HALF;
      const py = ORIGIN_Y + (hour + day) * TILE_H_HALF;

      const opacity = (0.3 + 0.7 * ratio).toFixed(2);
      const color = `#${accent}`;

      towers += `
      <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)})" opacity="${opacity}">
        <polygon points="0,${-h} ${TILE_W_HALF},${-h + TILE_H_HALF} 0,${-h + 2 * TILE_H_HALF} ${-TILE_W_HALF},${-h + TILE_H_HALF}" fill="${color}" opacity="0.9"/>
        <polygon points="${-TILE_W_HALF},${-h + TILE_H_HALF} 0,${-h + 2 * TILE_H_HALF} 0,${2 * TILE_H_HALF} ${-TILE_W_HALF},${TILE_H_HALF}" fill="${color}" opacity="0.7"/>
        <polygon points="0,${-h + 2 * TILE_H_HALF} ${TILE_W_HALF},${-h + TILE_H_HALF} ${TILE_W_HALF},${TILE_H_HALF} 0,${2 * TILE_H_HALF}" fill="${color}" opacity="0.5"/>
      </g>`;
    }
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let dayLabels = '';
  for (let day = 0; day < 7; day++) {
    const px = ORIGIN_X + (-2 - day) * TILE_W_HALF;
    const py = ORIGIN_Y + (-2 + day) * TILE_H_HALF;
    dayLabels += `<text x="${px.toFixed(1)}" y="${py.toFixed(1)}" fill="#${text}" font-family="'Inter',sans-serif" font-size="11" opacity="0.6" text-anchor="end" font-weight="600">${dayNames[day]}</text>\n`;
  }

  let hourLabels = '';
  const hoursToLabel = [0, 6, 12, 18];
  const hourNames = ['12a', '6a', '12p', '6p'];
  for (let i = 0; i < hoursToLabel.length; i++) {
    const hour = hoursToLabel[i];
    const px = ORIGIN_X + (hour - -1) * TILE_W_HALF;
    const py = ORIGIN_Y + (hour + -1) * TILE_H_HALF - 12;
    hourLabels += `<text x="${px.toFixed(1)}" y="${py.toFixed(1)}" fill="#${text}" font-family="'Inter',sans-serif" font-size="11" opacity="0.6" text-anchor="middle" font-weight="600">${hourNames[i]}</text>\n`;
  }

  const rx = params.radius ?? 8;
  const titleText = params.hide_title
    ? ''
    : `<text x="40" y="50" fill="#${text}" font-family="'Inter',sans-serif" font-size="18" font-weight="700">${escapeXML(params.custom_title || 'Circadian Rhythm : ' + safeUser)}</text>`;
  const totalCommits = stats.totalContributions;
  const statsPanel = params.hide_stats
    ? ''
    : `
    <text x="40" y="74" fill="#${text}" font-family="'Inter',sans-serif" font-size="13" opacity="0.7">Total Commits: <tspan font-weight="700" fill="#${accent}">${totalCommits}</tspan></text>
  `;

  return `<svg style="max-width: 100%; height: auto;" xmlns="http://www.w3.org/2000/svg" width="${Math.round(WIDTH * sf)}" height="${Math.round(HEIGHT * sf)}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="cp-punch-title" aria-describedby="cp-punch-desc">
  <title id="cp-punch-title">CommitPulse Punch Card Heatmap for ${safeUser}</title>
  <desc id="cp-punch-desc">A 3D isometric grid showing ${safeUser}'s commit frequency by day of week and hour of day.</desc>
  <defs>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;display=swap");
    </style>
  </defs>
  ${params.hideBackground ? '' : `<rect width="${WIDTH}" height="${HEIGHT}" fill="#${bg}" rx="${rx}"/>`}
  ${titleText}
  ${statsPanel}
  <g transform="translate(0, 40)">
    ${dayLabels}
    ${hourLabels}
    ${towers}
  </g>
</svg>`;
}
