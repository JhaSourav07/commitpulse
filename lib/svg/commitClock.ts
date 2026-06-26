// lib/svg/commitClock.ts

import type { BadgeParams, StreakStats } from '../../types';
import { escapeXML, sanitizeHexColor } from './sanitizer';
import { truncateUsername, getSizeScale } from './generator';

const WIDTH = 500;
const HEIGHT = 300;
const CX = 160;
const CY = 155;
const INNER_R = 45;
const OUTER_MAX_R = 120;

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
    Array.isArray(params.accent) ? params.accent[0] : params.accent,
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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(WIDTH * sf)}" height="${Math.round(HEIGHT * sf)}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="cp-clock-title" aria-describedby="cp-clock-desc">
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
