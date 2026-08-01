/**
 * lib/svg/commitClock.ts
 *
 * Renders a 24-hour polar "commit clock" SVG — a circular visualisation that
 * shows commit frequency by hour of day. Each of the 24 slices represents one
 * hour (0=midnight .. 23=11 PM). The slice radius scales proportionally with
 * the number of commits in that hour relative to the peak hour. The peak hour
 * is highlighted with a thicker stroke and the inner circle displays the
 * username and key streak statistics.
 *
 * The SVG uses polar coordinates centered at (CX, CY) with an inner void of
 * radius INNER_R to create a ring effect. Slices are drawn as annular wedges
 * (paths) built from two arcs and two radial lines.
 *
 * @module
 */

import type { BadgeParams, StreakStats } from '../../types';
import { escapeXML, sanitizeHexColor } from './sanitizer';
import { truncateUsername, getSizeScale } from './generator';

/** SVG canvas width in viewBox units. Scaled by getSizeScale() at render time. */
const WIDTH = 500;

/** SVG canvas height in viewBox units. Scaled by getSizeScale() at render time. */
const HEIGHT = 300;

/** X coordinate of the polar ring center. */
const CX = 160;

/** Y coordinate of the polar ring center. */
const CY = 155;

/** Inner radius of the commit clock ring (the "hole" in the donut). */
const INNER_R = 45;

/** Outer radius of the longest commit-hour slice (used for peak hour). */
const OUTER_MAX_R = 120;

/**
 * Renders a 24-hour commit clock SVG for the given user.
 *
 * The SVG is a polar ring split into 24 equal wedges (one per hour). Each wedge's
 * outer radius scales linearly with `hourCounts[h]` relative to the peak hour, creating
 * a visual "pulse" of the user's commit activity. The inner circle displays the
 * username, total commits, and streak statistics.
 *
 * @param hourCounts - An array of 24 integers where `hourCounts[h]` is the number
 *   of commits made during hour `h` (0 = midnight, 23 = 11 PM). Hours with no commits
 *   render with a minimal visible slice at INNER_R.
 * @param stats - Streak statistics used to populate the inner statistics panel.
 *   Required fields: `currentStreak`, `longestStreak`.
 * @param params - Badge rendering parameters. Controls background, text color, accent
 *   color, size scale, corner radius, and the optional hideBackground flag.
 * @returns A complete, self-contained SVG string suitable for embedding in a response
 *   or rendering on the server. No external stylesheets or fonts are required.
 *
 * @example
 * ```ts
 * const hourCounts = new Array(24).fill(0);
 * hourCounts[9] = 5;  // 5 commits at 9 AM
 * hourCounts[14] = 12; // peak at 2 PM
 * const svg = generateCommitClockSVG(hourCounts, stats, { user: 'octocat', size: 'medium' });
 * ```
 */
export function generateCommitClockSVG(
  hourCounts: number[],
  stats: StreakStats,
  params: BadgeParams
): string {
  const sf = getSizeScale(params.size);
  const safeUser = escapeXML(truncateUsername(params.user));
  const bg = sanitizeHexColor(params.bg, '0d1117');
  const text = sanitizeHexColor(Array.isArray(params.accent) ? undefined : params.text, 'c9d1d9');
  const accent = sanitizeHexColor(
    // Use the last color when a multi-color accent array is supplied, matching
    // the convention already used by lib/svg/generator.ts's 9 call sites.
    Array.isArray(params.accent) ? params.accent[params.accent.length - 1] : params.accent,
    '58a6ff'
  );

  const total = hourCounts.reduce((s, c) => s + c, 0);
  const maxCount = Math.max(...hourCounts, 1);
  const peakHour = hourCounts.indexOf(maxCount);

  const formatHour = (h: number) => {
    if (h === 0) return '12a';
    if (h === 12) return '12p';
    return h < 12 ? `${h}a` : `${h - 12}p`;
  };

  // Build 24 polar segments
  let segments = '';
  const sliceAngle = (2 * Math.PI) / 24;

  for (let h = 0; h < 24; h++) {
    const startAngle = h * sliceAngle - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;
    const ratio = hourCounts[h] / maxCount;
    const r = INNER_R + (OUTER_MAX_R - INNER_R) * ratio;
    const opacity = 0.3 + 0.7 * ratio;

    const x1 = CX + INNER_R * Math.cos(startAngle);
    const y1 = CY + INNER_R * Math.sin(startAngle);
    const x2 = CX + r * Math.cos(startAngle);
    const y2 = CY + r * Math.sin(startAngle);
    const x3 = CX + r * Math.cos(endAngle);
    const y3 = CY + r * Math.sin(endAngle);
    const x4 = CX + INNER_R * Math.cos(endAngle);
    const y4 = CY + INNER_R * Math.sin(endAngle);

    const isPeak = h === peakHour;
    const strokeW = isPeak ? 1.5 : 0.5;

    segments += `<path d="M${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)} A${r.toFixed(2)},${r.toFixed(2)} 0 0,1 ${x3.toFixed(2)},${y3.toFixed(2)} L${x4.toFixed(2)},${y4.toFixed(2)} A${INNER_R},${INNER_R} 0 0,0 ${x1.toFixed(2)},${y1.toFixed(2)} Z" fill="#${accent}" fill-opacity="${opacity.toFixed(2)}" stroke="#${accent}" stroke-width="${strokeW}" opacity="${opacity.toFixed(2)}"/>\n`;
  }

  // Cardinal labels: 12a, 6a, 12p, 6p
  const cardinals = [
    { h: 0, label: '12a' },
    { h: 6, label: '6a' },
    { h: 12, label: '12p' },
    { h: 18, label: '6p' },
  ];
  let cardinalLabels = '';
  for (const { h, label } of cardinals) {
    const angle = h * sliceAngle - Math.PI / 2;
    const lr = OUTER_MAX_R + 16;
    const lx = CX + lr * Math.cos(angle);
    const ly = CY + lr * Math.sin(angle);
    cardinalLabels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="#${text}" font-family="'Inter',sans-serif" font-size="10" text-anchor="middle" dominant-baseline="central" opacity="0.7">${label}</text>\n`;
  }

  // Inner circle
  const innerCircle = `<circle cx="${CX}" cy="${CY}" r="${INNER_R}" fill="#${bg}" stroke="#${text}" stroke-width="0.5" opacity="0.3"/>`;

  // Stats panel
  const statsX = 310;
  const statsPanel = `
<text x="${statsX}" y="70" fill="#${accent}" font-family="'Inter',sans-serif" font-size="13" font-weight="700" opacity="0.9">Commit Clock</text>
<text x="${statsX}" y="92" fill="#${text}" font-family="'Inter',sans-serif" font-size="11" opacity="0.6">${escapeXML(safeUser)}</text>

<text x="${statsX}" y="130" fill="#${text}" font-family="'Inter',sans-serif" font-size="10" opacity="0.5">PEAK HOUR</text>
<text x="${statsX}" y="148" fill="#${accent}" font-family="'Inter',sans-serif" font-size="22" font-weight="700">${formatHour(peakHour)}</text>

<text x="${statsX}" y="178" fill="#${text}" font-family="'Inter',sans-serif" font-size="10" opacity="0.5">SAMPLED COMMITS</text>
<text x="${statsX}" y="196" fill="#${text}" font-family="'Inter',sans-serif" font-size="16" font-weight="600">${total}</text>

<text x="${statsX}" y="220" fill="#${text}" font-family="'Inter',sans-serif" font-size="10" opacity="0.5">CURRENT STREAK</text>
<text x="${statsX}" y="238" fill="#${text}" font-family="'Inter',sans-serif" font-size="16" font-weight="600">${stats.currentStreak}d</text>

<text x="${statsX}" y="260" fill="#${text}" font-family="'Inter',sans-serif" font-size="10" opacity="0.5">LONGEST STREAK</text>
<text x="${statsX}" y="278" fill="#${text}" font-family="'Inter',sans-serif" font-size="16" font-weight="600">${stats.longestStreak}d</text>`;

  const rx = params.radius ?? 8;

  return `<svg style="max-width: 100%; height: auto;" xmlns="http://www.w3.org/2000/svg" width="${Math.round(WIDTH * sf)}" height="${Math.round(HEIGHT * sf)}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="cp-clock-title" aria-describedby="cp-clock-desc">
  <title id="cp-clock-title">CommitPulse Commit Clock for ${safeUser}</title>
  <desc id="cp-clock-desc">A 24-hour polar ring showing ${safeUser}'s commit frequency by hour of day.</desc>
  <defs>
    <filter id="cp-clock-glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  ${params.hideBackground ? '' : `<rect width="${WIDTH}" height="${HEIGHT}" fill="#${bg}" rx="${rx}"/>`}
  <g filter="url(#cp-clock-glow)">
${segments}  </g>
  ${innerCircle}
  ${cardinalLabels}
  ${statsPanel}
</svg>`;
}
