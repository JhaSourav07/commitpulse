// lib/svg/constellation.ts

import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';
import { deterministicRandom, truncateUsername, getSizeScale } from './generator';
import { escapeXML } from './sanitizer';
import {
  CONSTELLATION_SVG_WIDTH,
  CONSTELLATION_SVG_HEIGHT,
  CONSTELLATION_CENTER_X,
  CONSTELLATION_CENTER_Y,
  ZODIAC_RING_OUTER_R,
  ZODIAC_RING_INNER_R,
  ZODIAC_RING_STROKE_WIDTH,
  MONTH_LABEL_RADIUS,
  STARFIELD_MIN_X,
  STARFIELD_MAX_X,
  STARFIELD_MIN_Y,
  STARFIELD_MAX_Y,
  STAR_RADIUS_MIN,
  STAR_RADIUS_MAX,
  DEFAULT_BG_STAR_COUNT,
  MIN_BG_STAR_COUNT,
  MAX_BG_STAR_COUNT,
  STAR_OPACITY_MIN,
  STAR_OPACITY_MAX,
  CONSTELLATION_LINE_OPACITY,
  BRIGHT_STARS_PER_MONTH,
  USERNAME_LABEL_X,
  USERNAME_LABEL_Y,
  YEAR_LABEL_X,
  YEAR_LABEL_Y,
  SUBTITLE_X,
  SUBTITLE_Y,
  LEGEND_X,
  LEGEND_Y,
  CSS_PREFIX,
  MONTH_ABBREVIATIONS,
} from './constellationConstants';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BackgroundStar {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  animationDelay: number;
  tier: 'dim' | 'medium' | 'bright';
}

interface ContributionStar {
  x: number;
  y: number;
  r: number;
  opacity: number;
  date: string;
  count: number;
  monthIndex: number; // 0-11
}

interface ConstellationLines {
  monthIndex: number;
  label: string;
  points: { x: number; y: number }[];
  pathD: string;
}

// ─── Background Starfield ───────────────────────────────────────────────────

function generateBackgroundStars(seed: string, density: number): BackgroundStar[] {
  const clampedDensity = Math.max(MIN_BG_STAR_COUNT, Math.min(MAX_BG_STAR_COUNT, density));
  const stars: BackgroundStar[] = [];

  for (let i = 0; i < clampedDensity; i++) {
    const posSeed = deterministicRandom(`${seed}:bg:pos:${i}`);
    const brightnessSeed = deterministicRandom(`${seed}:bg:bright:${i}`);
    const delaySeed = deterministicRandom(`${seed}:bg:delay:${i}`);

    // Position: spread across the full canvas, avoiding the very center ring area slightly
    const cx = STARFIELD_MIN_X + posSeed * (STARFIELD_MAX_X - STARFIELD_MIN_X);
    const cy = STARFIELD_MIN_Y + brightnessSeed * (STARFIELD_MAX_Y - STARFIELD_MIN_Y);

    // Avoid placing bg stars right on the ring boundary (keep them visually distinct)
    const distFromCenter = Math.sqrt(
      (cx - CONSTELLATION_CENTER_X) ** 2 + (cy - CONSTELLATION_CENTER_Y) ** 2
    );
    const effectiveRadius =
      distFromCenter < ZODIAC_RING_INNER_R - 10 ? STAR_RADIUS_MIN * 0.6 : STAR_RADIUS_MIN * 0.8;

    // 3 brightness tiers
    const tierRand = deterministicRandom(`${seed}:bg:tier:${i}`);
    let tier: 'dim' | 'medium' | 'bright';
    let opacity: number;
    let r: number;
    if (tierRand < 0.6) {
      tier = 'dim';
      opacity = 0.15 + brightnessSeed * 0.15;
      r = effectiveRadius * 0.5;
    } else if (tierRand < 0.88) {
      tier = 'medium';
      opacity = 0.3 + brightnessSeed * 0.2;
      r = effectiveRadius * 0.8;
    } else {
      tier = 'bright';
      opacity = 0.5 + brightnessSeed * 0.3;
      r = effectiveRadius * 1.2;
    }

    stars.push({
      cx: Math.round(cx * 10) / 10,
      cy: Math.round(cy * 10) / 10,
      r: Math.round(r * 10) / 10,
      opacity: Math.round(opacity * 100) / 100,
      animationDelay: Math.round(delaySeed * 300) / 100,
      tier,
    });
  }

  return stars;
}

// ─── Contribution Star Placement ─────────────────────────────────────────────

function buildContributionStars(
  calendar: ContributionCalendar,
  year: number,
  seed: string,
  maxContributions: number
): ContributionStar[] {
  const stars: ContributionStar[] = [];
  const allDays = calendar.weeks.flatMap((w) => w.contributionDays);

  for (const day of allDays) {
    if (day.contributionCount <= 0) continue;

    const date = new Date(day.date + 'T12:00:00Z');
    const monthIndex = date.getUTCMonth(); // 0-11
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(`${year}-01-01T00:00:00Z`).getTime()) / 86400000
    );

    // Position: spiral layout within the ring, offset by month
    const angleBase = (monthIndex / 12) * Math.PI * 2;
    const spiralAngle = angleBase + (dayOfYear % 31) * 0.15;
    const distFactor = 0.25 + deterministicRandom(`${seed}:star:dist:${day.date}`) * 0.55;
    const radius = ZODIAC_RING_INNER_R * distFactor;

    const x = CONSTELLATION_CENTER_X + Math.cos(spiralAngle) * radius;
    const y = CONSTELLATION_CENTER_Y + Math.sin(spiralAngle) * radius;

    // Star size scales with contribution count
    const sizeRatio = maxContributions > 0 ? day.contributionCount / maxContributions : 0;
    const r = STAR_RADIUS_MIN + sizeRatio * (STAR_RADIUS_MAX - STAR_RADIUS_MIN);
    const opacity = STAR_OPACITY_MIN + sizeRatio * (STAR_OPACITY_MAX - STAR_OPACITY_MIN);

    stars.push({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      r: Math.round(r * 10) / 10,
      opacity: Math.round(opacity * 100) / 100,
      date: day.date,
      count: day.contributionCount,
      monthIndex,
    });
  }

  return stars;
}

// ─── Constellation Lines Algorithm ───────────────────────────────────────────

function buildConstellationLines(stars: ContributionStar[]): ConstellationLines[] {
  const constellations: ConstellationLines[] = [];

  for (let m = 0; m < 12; m++) {
    const monthStars = stars.filter((s) => s.monthIndex === m).sort((a, b) => b.count - a.count);

    // Need at least 2 stars to draw a line
    if (monthStars.length < 2) continue;

    // Take the top N brightest stars
    const brightest = monthStars.slice(0, BRIGHT_STARS_PER_MONTH);

    if (brightest.length < 2) continue;

    // Build path connecting brightest stars in order of date
    const sorted = brightest.sort(
      (a, b) =>
        new Date(a.date + 'T12:00:00Z').getTime() - new Date(b.date + 'T12:00:00Z').getTime()
    );

    const points = sorted.map((s) => ({ x: s.x, y: s.y }));
    const pathD = points.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`)).join(' ');

    constellations.push({
      monthIndex: m,
      label: MONTH_ABBREVIATIONS[m],
      points,
      pathD,
    });
  }

  return constellations;
}

// ─── Zodiac Ring ────────────────────────────────────────────────────────────

function buildZodiacRing(textColor: string, currentMonthIndex: number): string {
  const arcs: string[] = [];

  for (let m = 0; m < 12; m++) {
    const startAngle = (m / 12) * Math.PI * 2 - Math.PI / 2;
    const endAngle = ((m + 1) / 12) * Math.PI * 2 - Math.PI / 2;

    const x1 = CONSTELLATION_CENTER_X + ZODIAC_RING_OUTER_R * Math.cos(startAngle);
    const y1 = CONSTELLATION_CENTER_Y + ZODIAC_RING_OUTER_R * Math.sin(startAngle);
    const x2 = CONSTELLATION_CENTER_X + ZODIAC_RING_OUTER_R * Math.cos(endAngle);
    const y2 = CONSTELLATION_CENTER_Y + ZODIAC_RING_OUTER_R * Math.sin(endAngle);

    const isCurrentMonth = m === currentMonthIndex;
    const opacity = isCurrentMonth ? 0.35 : 0.08;
    const strokeWidth = isCurrentMonth ? ZODIAC_RING_STROKE_WIDTH * 2 : ZODIAC_RING_STROKE_WIDTH;
    const largeArc = 0; // each arc is 30°, always < 180°

    arcs.push(
      `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${ZODIAC_RING_OUTER_R} ${ZODIAC_RING_OUTER_R} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="#${textColor}" stroke-width="${strokeWidth}" opacity="${opacity}" />`
    );
  }

  return arcs.join('\n      ');
}

// ─── Month Labels ───────────────────────────────────────────────────────────

function buildMonthLabels(textColor: string, currentMonthIndex: number): string {
  const labels: string[] = [];

  for (let m = 0; m < 12; m++) {
    const angle = (m / 12) * Math.PI * 2 - Math.PI / 2;
    const x = CONSTELLATION_CENTER_X + MONTH_LABEL_RADIUS * Math.cos(angle);
    const y = CONSTELLATION_CENTER_Y + MONTH_LABEL_RADIUS * Math.sin(angle);

    const isCurrentMonth = m === currentMonthIndex;
    const opacity = isCurrentMonth ? 0.9 : 0.3;
    const fontWeight = isCurrentMonth ? 'bold' : 'normal';

    labels.push(
      `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="#${textColor}" font-family="'Inter', sans-serif" font-size="9" opacity="${opacity}" font-weight="${fontWeight}">${MONTH_ABBREVIATIONS[m]}</text>`
    );
  }

  return labels.join('\n      ');
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function buildLegend(textColor: string): string {
  return `
      <text x="${LEGEND_X}" y="${LEGEND_Y}" fill="#${textColor}" font-family="'Inter', sans-serif" font-size="10" opacity="0.6">
        <tspan font-weight="bold" font-size="11">●</tspan> 1-3  <tspan font-weight="bold" font-size="11" dx="8">◉</tspan> 4-10  <tspan font-weight="bold" font-size="11" dx="8">✦</tspan> 11+
      </text>`;
}

// ─── CSS Animations ─────────────────────────────────────────────────────────

function buildConstellationCSS(): string {
  return `
    @keyframes ${CSS_PREFIX}-twinkle {
      0%, 100% { opacity: var(--twinkle-opacity, 0.3); }
      50% { opacity: calc(var(--twinkle-opacity, 0.3) * 2.5); }
    }
    @keyframes ${CSS_PREFIX}-constellation-glow {
      0%, 100% { opacity: ${CONSTELLATION_LINE_OPACITY}; }
      50% { opacity: ${CONSTELLATION_LINE_OPACITY * 2}; }
    }
    @keyframes ${CSS_PREFIX}-star-pulse {
      0%, 100% { opacity: var(--star-opacity, 0.7); filter: drop-shadow(0 0 2px var(--star-glow, currentColor)); }
      50% { opacity: 1; filter: drop-shadow(0 0 6px var(--star-glow, currentColor)); }
    }
    @keyframes ${CSS_PREFIX}-milkyway-rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }`;
}

// ─── Milky Way Gradient Band ─────────────────────────────────────────────────

function buildMilkyWayGradientDef(): string {
  return `
        <linearGradient id="${CSS_PREFIX}-milkyway" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="white" stop-opacity="0" />
          <stop offset="35%" stop-color="white" stop-opacity="0.03" />
          <stop offset="50%" stop-color="white" stop-opacity="0.06" />
          <stop offset="65%" stop-color="white" stop-opacity="0.03" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
        </linearGradient>`;
}

// ─── Main Generator ─────────────────────────────────────────────────────────

export function generateConstellationSVG(
  _stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  const sf = getSizeScale(params.size);
  const safeUser = escapeXML(truncateUsername(params.user));
  const bgColor = params.bg || '0d1117';
  const textColor = params.text || 'c9d1d9';
  const accentColor = Array.isArray(params.accent) ? params.accent[0] : params.accent || '58a6ff';

  // Determine year from calendar data
  const firstDay = calendar.weeks[0]?.contributionDays[0];
  const year = firstDay
    ? new Date(firstDay.date + 'T12:00:00Z').getUTCFullYear()
    : new Date().getUTCFullYear();
  // Use the streak's todayDate for stable current-month highlighting across instances
  const currentMonthIndex = _stats.todayDate
    ? new Date(_stats.todayDate + 'T12:00:00Z').getUTCMonth()
    : new Date().getUTCMonth();

  // Seed for deterministic generation
  const seed = `${params.user}:${year}`;

  // Uses default background star count; configurable density param is a future enhancement
  const density = DEFAULT_BG_STAR_COUNT;

  // Find max contributions for scaling
  const allDays = calendar.weeks.flatMap((w) => w.contributionDays);
  const maxContributions = allDays.reduce((max, d) => Math.max(max, d.contributionCount), 0);

  // Generate elements
  const bgStars = generateBackgroundStars(seed, density);
  const contribStars = buildContributionStars(calendar, year, seed, maxContributions);
  const constellations = buildConstellationLines(contribStars);

  // ── Build SVG ──────────────────────────────────────────────────────────

  // Background stars
  const bgStarsSVG = bgStars
    .map(
      (s) =>
        `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="#${textColor}" opacity="${s.opacity}" style="animation: ${CSS_PREFIX}-twinkle ${(3 + s.animationDelay).toFixed(1)}s ease-in-out infinite; animation-delay: ${s.animationDelay}s; --twinkle-opacity: ${s.opacity};" />`
    )
    .join('\n        ');

  // Contribution stars
  const contribStarsSVG = contribStars
    .map(
      (s) =>
        `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#${accentColor}" opacity="${s.opacity}" style="animation: ${CSS_PREFIX}-star-pulse 3s ease-in-out infinite; animation-delay: ${(deterministicRandom(`${seed}:pulse:${s.date}`) * 2).toFixed(1)}s; --star-opacity: ${s.opacity}; --star-glow: #${accentColor};" />`
    )
    .join('\n        ');

  // Constellation lines
  const linesSVG = constellations
    .map(
      (c) =>
        `<path d="${c.pathD}" fill="none" stroke="#${accentColor}" stroke-width="0.8" stroke-dasharray="4 3" opacity="${CONSTELLATION_LINE_OPACITY}" style="animation: ${CSS_PREFIX}-constellation-glow 4s ease-in-out infinite;" />`
    )
    .join('\n        ');

  // Constellation month labels
  const constLabelsSVG = constellations
    .map((c) => {
      const avgX = c.points.reduce((sum, p) => sum + p.x, 0) / c.points.length;
      const avgY = c.points.reduce((sum, p) => sum + p.y, 0) / c.points.length;
      return `<text x="${avgX.toFixed(1)}" y="${(avgY - 8).toFixed(1)}" text-anchor="middle" fill="#${accentColor}" font-family="'Inter', sans-serif" font-size="7" opacity="0.5">${c.label}</text>`;
    })
    .join('\n        ');

  // Zodiac ring
  const ringSVG = buildZodiacRing(textColor, currentMonthIndex);

  // Month labels
  const monthLabelsSVG = buildMonthLabels(textColor, currentMonthIndex);

  // Legend
  const legendSVG = buildLegend(textColor);

  // CSS
  const css = buildConstellationCSS();

  // Milky Way gradient def
  const milkyWayGradientDef = buildMilkyWayGradientDef();

  // ── Assemble final SVG ─────────────────────────────────────────────────
  const svg = `<svg style="max-width: 100%; height: auto;" xmlns="http://www.w3.org/2000/svg" width="${Math.round(CONSTELLATION_SVG_WIDTH * sf)}" height="${Math.round(CONSTELLATION_SVG_HEIGHT * sf)}" viewBox="0 0 ${CONSTELLATION_SVG_WIDTH} ${CONSTELLATION_SVG_HEIGHT}" role="img" aria-labelledby="cp-constellation-title cp-constellation-desc">
  <title id="cp-constellation-title">CommitPulse Constellation Map for ${safeUser}</title>
  <desc id="cp-constellation-desc">A celestial star-map visualization of ${safeUser}'s GitHub contributions in ${year}. Each star represents a day with contributions; brighter stars indicate more commits. Constellation lines connect the brightest stars within each month.</desc>
  <defs>
    <style>${css}</style>
    ${milkyWayGradientDef}
    <filter id="${CSS_PREFIX}-glow">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>

  <rect width="${CONSTELLATION_SVG_WIDTH}" height="${CONSTELLATION_SVG_HEIGHT}" fill="#${bgColor}" rx="8" />

  <rect x="0" y="0" width="${CONSTELLATION_SVG_WIDTH}" height="${CONSTELLATION_SVG_HEIGHT}" fill="url(#${CSS_PREFIX}-milkyway)" />

  <g id="${CSS_PREFIX}-bg-stars">
    ${bgStarsSVG}
  </g>

  <g id="${CSS_PREFIX}-zodiac-ring">
    ${ringSVG}
  </g>

  <g id="${CSS_PREFIX}-month-labels">
    ${monthLabelsSVG}
  </g>

  <g id="${CSS_PREFIX}-constellation-lines" filter="url(#${CSS_PREFIX}-glow)">
    ${linesSVG}
  </g>

  <g id="${CSS_PREFIX}-constellation-labels">
    ${constLabelsSVG}
  </g>

  <g id="${CSS_PREFIX}-contrib-stars" filter="url(#${CSS_PREFIX}-glow)">
    ${contribStarsSVG}
  </g>

  <text x="${USERNAME_LABEL_X}" y="${USERNAME_LABEL_Y}" fill="#${textColor}" font-family="'Inter', 'Space Grotesk', sans-serif" font-size="18" font-weight="700">${safeUser}</text>

  <text x="${YEAR_LABEL_X}" y="${YEAR_LABEL_Y}" text-anchor="end" fill="#${textColor}" font-family="'Inter', 'Space Grotesk', sans-serif" font-size="18" font-weight="700" opacity="0.7">${year}</text>

  <text x="${SUBTITLE_X}" y="${SUBTITLE_Y}" text-anchor="middle" fill="#${textColor}" font-family="'Inter', sans-serif" font-size="11" opacity="0.4">Constellation Map</text>

  ${legendSVG}
</svg>`;

  return svg;
}
