import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';
import { getLabels } from '../i18n/badgeLabels';
import { AUTO_DARK_THEME, AUTO_LIGHT_THEME } from './themes';

// constants
const GHOST_HEIGHT_PX = 4;
const LOG_SCALE_MULTIPLIER = 12;
const LINEAR_SCALE_MULTIPLIER = 5;
const MAX_LOG_HEIGHT = 80;
const MAX_LINEAR_HEIGHT = 50;

// TOWER_BASE_Y: the vertical midpoint of the isometric ground floor diamond in local SVG space.
// The diamond paths are drawn from y=0 (back vertex) to y=20 (front vertex), making y=10
// the horizontal center line that acts as the visual ground level for each tower.
// This value is used as the CSS transform-origin for the grow-up animation so towers
// scale upward from their ground tile rather than from the SVG origin.
const TOWER_BASE_Y = 10;

// Shared animation CSS injected into both static and auto-theme SVG renderers.
// Defined once here to avoid duplication — any curve/timing change only needs updating in one place.
const TOWER_ANIMATION_CSS = `
  .cp-tower {
    transform: scaleY(0);
    transform-origin: 0 ${TOWER_BASE_Y}px;
    animation: grow-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes grow-up {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .cp-tower { animation: none !important; transform: scaleY(1) !important; }
  }`;

const FONT_MAP: Record<string, string> = {
  jetbrains: '"JetBrains Mono", monospace',
  fira: '"Fira Code", monospace',
  roboto: '"Roboto", sans-serif',
};

// types
/** Shared layout data for a single isometric tower. */
interface FaceOpacity {
  left: number;
  right: number;
  top: number;
}

interface TowerData {
  x: number;
  y: number;
  h: number;
  hasCommits: boolean;
  isGhost: boolean;
  isToday: boolean;
  isTodayWithCommits: boolean;
  tooltip: string;
  contributionCount: number;
  faceOpacity: FaceOpacity;
  strokeOpacity: number;
  strokeWidth: number;
  /** Grid position used to compute the staggered animation-delay (row + col) * offset */
  row: number;
  col: number;
}

// helpers
function deterministicRandom(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}
function computeTowerHeight(
  count: number,
  scale: 'linear' | 'log',
  shouldShowGhostCity: boolean
): number {
  if (count === 0 && shouldShowGhostCity) return GHOST_HEIGHT_PX;
  if (count === 0) return 0;
  return scale === 'log'
    ? Math.min(Math.log2(count + 1) * LOG_SCALE_MULTIPLIER, MAX_LOG_HEIGHT)
    : Math.min(count * LINEAR_SCALE_MULTIPLIER, MAX_LINEAR_HEIGHT);
}

function computeFaceOpacity(count: number, isGhostCityMode: boolean): FaceOpacity {
  if (isGhostCityMode) {
    return { left: 0, right: 0, top: 0.02 };
  }
  if (count === 0) {
    return { left: 0, right: 0, top: 0.02 };
  }
  return { left: 0.35, right: 0.21, top: 0.7 };
}

/**
 * Computes tower positions and heights from the last 14 weeks of
 * contribution data. The layout math is identical for both the
 * static-theme and auto-theme rendering paths.
 */
function computeTowers(
  calendar: ContributionCalendar,
  scale: 'linear' | 'log',
  todayDate: string
): TowerData[] {
  const weeks = calendar.weeks.slice(-14);
  const towers: TowerData[] = [];

  // Calculate if the entire monolith is empty
  let totalVisibleContributions = 0;
  weeks.forEach((week) => {
    week.contributionDays.forEach((day) => {
      totalVisibleContributions += day.contributionCount;
    });
  });

  const shouldShowGhostCity = totalVisibleContributions === 0;

  // Pre-check: is todayDate present in the visible 14-week window?
  // If not (e.g. stale cache or todayDate outside the window), fall back to
  // marking the last visible day as "today" so the pulse always appears.
  const todayInWindow = weeks.some((w) => w.contributionDays.some((d) => d.date === todayDate));

  weeks.forEach((week, i) => {
    week.contributionDays.forEach((day, j) => {
      // Use the caller-supplied local date so the pulse animation fires on the
      // correct tower for users in non-UTC timezones, not always the last UTC entry.
      const isToday =
        day.date === todayDate ||
        // Fallback: if todayDate isn't in the visible window, keep the old behaviour.
        (!todayInWindow && i === weeks.length - 1 && j === week.contributionDays.length - 1);
      const hasCommits = day.contributionCount > 0;
      const isGhost = !hasCommits && shouldShowGhostCity;
      const isTodayWithCommits = isToday && hasCommits;

      const tooltip = isTodayWithCommits
        ? `TODAY: ${day.date}: ${day.contributionCount} contributions`
        : `${day.date}: ${day.contributionCount} contributions`;

      // If not ghost city and no commits, height is 0, so don't render face if not needed,
      // but we return 0 for height so it won't be visible.
      towers.push({
        x: 300 + (i - j) * 16,
        y: 120 + (i + j) * 9,
        h: computeTowerHeight(day.contributionCount, scale, shouldShowGhostCity),
        hasCommits,
        isGhost,
        isToday,
        isTodayWithCommits,
        tooltip,
        contributionCount: day.contributionCount,
        faceOpacity: computeFaceOpacity(day.contributionCount, shouldShowGhostCity),
        strokeOpacity: isGhost ? 0.3 : 0,
        strokeWidth: isGhost ? 0.5 : 0,
        row: i,
        col: j,
      });
    });
  });

  return towers;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function generateParticles(
  x: number,
  y: number,
  height: number,
  color: string,
  count: number
): string {
  let particles = '';
  const particleCount = Math.min(5, Math.max(3, Math.floor(count / 4)));

  for (let i = 0; i < particleCount; i++) {
    const seed = `${x}:${y}:${height}:${color}:${count}:${i}`;
    const offsetX = deterministicRandom(`${seed}:offsetX`) * 6 - 3;
    const delay = deterministicRandom(`${seed}:delay`) * 1.5;

    particles += `
      <circle cx="${x + offsetX}" cy="${y - height}" r="1.5" fill="${color}" opacity="1">
        <animate attributeName="cy" from="${y - height}" to="${y - height - 20}" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
      </circle>
    `;
  }
  return `<g class="heat-particles">${particles}</g>`;
}

function generateAutoParticles(x: number, y: number, height: number, count: number): string {
  let particles = '';
  const particleCount = Math.min(5, Math.max(3, Math.floor(count / 4)));

  for (let i = 0; i < particleCount; i++) {
    const seed = `${x}:${y}:${height}:auto:${count}:${i}`;
    const offsetX = deterministicRandom(`${seed}:offsetX`) * 6 - 3;
    const delay = deterministicRandom(`${seed}:delay`) * 1.5;

    particles += `
      <circle class="cp-accent-fill" cx="${x + offsetX}" cy="${y - height}" r="1.5" opacity="1">
        <animate attributeName="cy" from="${y - height}" to="${y - height - 20}" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
      </circle>
    `;
  }
  return `<g class="heat-particles">${particles}</g>`;
}

// main renderers
export function generateSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  // Dispatch to the auto-theme renderer when the caller requests it.
  // This keeps the existing static-theme path completely unchanged.
  if (params.autoTheme) {
    return generateAutoThemeSVG(stats, params, calendar);
  }
  const safeUser = escapeXML(params.user || 'GitHub User');

  const bg = `#${(params.bg || '0d1117').replace('#', '')}`;
  const accent = `#${(params.accent || '00ffaa').replace('#', '')}`;
  const text = `#${(params.text || 'ffffff').replace('#', '')}`;

  const sanitizeFont = (name: string): string => name.replace(/[^a-zA-Z0-9\s\-']/g, '').trim();
  const sanitizedFont = params.font ? sanitizeFont(params.font) : null;
  const predefinedFont = sanitizedFont ? FONT_MAP[sanitizedFont.toLowerCase()] : null;
  const isPredefinedFont = Boolean(predefinedFont);
  const selectedFont = isPredefinedFont
    ? predefinedFont
    : sanitizedFont
      ? `"${sanitizedFont}", sans-serif`
      : null;

  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50));
  const labels = getLabels(params.lang);

  const towerData = computeTowers(calendar, params.scale, stats.todayDate);
  let towers = '';

  for (const t of towerData) {
    const color = t.isGhost ? text : accent;
    // Stagger delay creates a diagonal wave across the isometric grid (back-to-front)
    const delay = ((t.row + t.col) * 0.015).toFixed(3);

    // The outer <g> positions the group at the ground tile (t.x, t.y).
    // The inner <g class="cp-tower"> is what CSS animates with scaleY.
    // Keeping these two responsibilities in separate elements prevents the
    // CSS transform from fighting the SVG translate — they operate independently.
    // Geometry paths are drawn offset by -t.h so they extend upward from y=10 (ground).
    towers += `
        <g transform="translate(${t.x}, ${t.y})">
          <g class="cp-tower" style="animation-delay: ${delay}s;">
            ${t.isTodayWithCommits ? '<animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />' : ''}
            <title>${t.tooltip}</title>
            <path d="M0 ${10 - t.h} L0 10 L-16 0 L-16 ${-t.h} Z" fill="${color}" fill-opacity="${t.faceOpacity.left}" stroke="${color}" stroke-opacity="${t.strokeOpacity}" stroke-width="${t.strokeWidth}" />
            <path d="M0 ${10 - t.h} L0 10 L16 0 L16 ${-t.h} Z" fill="${color}" fill-opacity="${t.faceOpacity.right}" stroke="${color}" stroke-opacity="${t.strokeOpacity}" stroke-width="${t.strokeWidth}" />
            <path d="M0 ${-t.h} L16 ${10 - t.h} L0 ${20 - t.h} L-16 ${10 - t.h} Z" fill="${color}" fill-opacity="${t.faceOpacity.top}" stroke="${color}" stroke-opacity="${t.strokeOpacity}" stroke-width="${t.strokeWidth}" />
            ${t.contributionCount > 5 ? `<path d="M0 ${-t.h} L16 ${10 - t.h} L0 ${20 - t.h} L-16 ${10 - t.h} Z" fill="white" fill-opacity="0.2" />` : ''}
          </g>
        </g>`;
    if (t.contributionCount >= 10)
      towers += generateParticles(t.x, t.y, t.h, accent, t.contributionCount);
  }

  // dynamic google fonts import
  const googleFontsImport =
    sanitizedFont && !isPredefinedFont
      ? `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(sanitizedFont).replace(/%20/g, '+')}&amp;display=swap');`
      : '';

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="600"
  height="420"
  viewBox="0 0 600 420"
  fill="none"
  role="img"
>
  <title>CommitPulse Stats for ${safeUser}</title>
  <desc>
    ${params.user || 'This user'} has ${stats.totalContributions} total contributions and a longest streak of ${stats.longestStreak} days.
  </desc>
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
  </defs>

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;display=swap');
  ${googleFontsImport}
  ${TOWER_ANIMATION_CSS}

  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: ${text}; font-size: 18px; letter-spacing: 6px; font-weight: 400; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: ${text}; font-size: 42px; font-weight: 500; letter-spacing: 0; }
  .total-val { font-family: ${statsFont}; fill: ${accent}; font-size: 24px; font-weight: 500; }
  .label { font-family: "Roboto", sans-serif; fill: ${accent}; font-size: 11px; font-weight: 400; letter-spacing: 2px; opacity: 0.7; }

  @media (prefers-reduced-motion: reduce) { .heat-particles { display: none; } }
  </style>

  <rect width="600" height="420" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bg}" />

  <g transform="translate(0, 20)">${towers}</g>
  ${
    !params.hide_stats
      ? `
  <g transform="translate(40, 340)">
    <text class="label">${labels.CURRENT_STREAK}</text>
    <text y="40" class="stats" filter="url(#glow)">${stats.currentStreak}</text>
  </g>

  <g transform="translate(300, 340)" text-anchor="middle">
    <text class="label">${labels.ANNUAL_SYNC_TOTAL}</text>
    <text y="40" class="total-val" filter="url(#glow)">${stats.totalContributions}</text>
  </g>

  <g transform="translate(560, 340)" text-anchor="end">
    <text class="label">${labels.PEAK_STREAK}</text>
    <text y="40" class="stats">${stats.longestStreak}</text>
  </g>
`
      : ''
  }

${
  !params.hide_title
    ? `<text x="300" y="50" text-anchor="middle" class="title">${safeUser.toUpperCase()}</text>`
    : ''
}

<rect x="100" y="60" width="400" height="1" fill="${accent}" fill-opacity="0.3">
  <animate attributeName="y" values="80;320;80" dur="${params.speed || '8s'}" repeatCount="indefinite" />
</rect>
</svg>
`;
}

/**
 * Generates an SVG that automatically switches between a light and
 * dark color palette using CSS @media (prefers-color-scheme: dark).
 *
 * All fill colors are driven by CSS custom properties (--cp-bg,
 * --cp-text, --cp-accent) so the browser swaps them at runtime
 * without any JavaScript.  Because GitHub README images are served
 * as <img> resources, the browser's native CSS engine renders the
 * SVG and fully respects the media query.
 */
function generateAutoThemeSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  const light = AUTO_LIGHT_THEME;
  const dark = AUTO_DARK_THEME;
  const safeUser = escapeXML(params.user || 'GitHub User');
  const sanitizeFont = (name: string): string => name.replace(/[^a-zA-Z0-9\s\-']/g, '').trim();
  const sanitizedFont = params.font ? sanitizeFont(params.font) : null;
  const predefinedFont = sanitizedFont ? FONT_MAP[sanitizedFont.toLowerCase()] : null;
  const selectedFont = predefinedFont || (sanitizedFont ? `"${sanitizedFont}", sans-serif` : null);
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50));
  const labels = getLabels(params.lang);

  const towerData = computeTowers(calendar, params.scale, stats.todayDate);
  let towers = '';

  for (const t of towerData) {
    // isGhost is the single source of truth for color class — no hasCommits redundancy
    const fillClass = t.isGhost ? 'cp-text-fill' : 'cp-accent-fill';
    // Ghost strokes use --cp-text; active towers have no outline (strokeOpacity=0 handles suppression)
    const strokeColor = t.isGhost ? 'var(--cp-text)' : 'var(--cp-accent)';
    // Stagger delay creates a diagonal wave across the isometric grid (back-to-front)
    const delay = ((t.row + t.col) * 0.015).toFixed(3);

    // The outer <g> positions the group at the ground tile (t.x, t.y).
    // The inner <g class="cp-tower"> is what CSS animates with scaleY.
    // Keeping these two responsibilities in separate elements prevents the
    // CSS transform from fighting the SVG translate — they operate independently.
    // Geometry paths are drawn offset by -t.h so they extend upward from y=10 (ground).
    towers += `
        <g transform="translate(${t.x}, ${t.y})">
          <g class="cp-tower" style="animation-delay: ${delay}s;">
            ${t.isTodayWithCommits ? '<animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />' : ''}
            <title>${t.tooltip}</title>
            <path d="M0 ${10 - t.h} L0 10 L-16 0 L-16 ${-t.h} Z" class="${fillClass}" fill-opacity="${t.faceOpacity.left}" stroke="${strokeColor}" stroke-opacity="${t.strokeOpacity}" stroke-width="${t.strokeWidth}" />
            <path d="M0 ${10 - t.h} L0 10 L16 0 L16 ${-t.h} Z" class="${fillClass}" fill-opacity="${t.faceOpacity.right}" stroke="${strokeColor}" stroke-opacity="${t.strokeOpacity}" stroke-width="${t.strokeWidth}" />
            <path d="M0 ${-t.h} L16 ${10 - t.h} L0 ${20 - t.h} L-16 ${10 - t.h} Z" class="${fillClass}" fill-opacity="${t.faceOpacity.top}" stroke="${strokeColor}" stroke-opacity="${t.strokeOpacity}" stroke-width="${t.strokeWidth}" />
            ${t.contributionCount > 5 ? `<path d="M0 ${-t.h} L16 ${10 - t.h} L0 ${20 - t.h} L-16 ${10 - t.h} Z" fill="white" fill-opacity="0.2" />` : ''}
          </g>
        </g>`;
    if (t.contributionCount >= 10)
      towers += generateAutoParticles(t.x, t.y, t.h, t.contributionCount);
  }

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="600"
  height="420"
  viewBox="0 0 600 420"
  fill="none"
  role="img"
>
  <title>CommitPulse Stats for ${safeUser} </title>
  <desc>
    ${params.user || 'This user'} has ${stats.totalContributions} total contributions and a longest streak of ${stats.longestStreak} days.
  </desc>
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
  </defs>

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;display=swap');
  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; } }
  .cp-bg-fill { fill: var(--cp-bg); } .cp-text-fill { fill: var(--cp-text); color: var(--cp-text); } .cp-accent-fill { fill: var(--cp-accent); color: var(--cp-accent); }
  ${TOWER_ANIMATION_CSS}
  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: var(--cp-text); font-size: 18px; letter-spacing: 6px; font-weight: 400; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: var(--cp-text); font-size: 42px; font-weight: 500; letter-spacing: 0; }
  .total-val { font-family: ${statsFont}; fill: var(--cp-accent); font-size: 24px; font-weight: 500; }
  .label { font-family: "Roboto", sans-serif; fill: var(--cp-accent); font-size: 11px; font-weight: 400; letter-spacing: 2px; opacity: 0.7; }

  @media (prefers-reduced-motion: reduce) { .heat-particles { display: none; } }
  </style>

  <rect width="600" height="420" rx="${radius}" ${params.hideBackground ? 'fill="transparent"' : 'class="cp-bg-fill"'} />
  <g transform="translate(0, 20)">
    ${towers}
  </g>
  ${
    !params.hide_stats
      ? `
  <g transform="translate(40, 340)">
    <text class="label">${labels.CURRENT_STREAK}</text>
    <text y="40" class="stats" filter="url(#glow)">${stats.currentStreak}</text>
  </g>

  <g transform="translate(300, 340)" text-anchor="middle">
    <text class="label">${labels.ANNUAL_SYNC_TOTAL}</text>
    <text y="40" class="total-val" filter="url(#glow)">${stats.totalContributions}</text>
  </g>

  <g transform="translate(560, 340)" text-anchor="end">
    <text class="label">${labels.PEAK_STREAK}</text>
    <text y="40" class="stats">${stats.longestStreak}</text>
  </g>
`
      : ''
  }

${
  !params.hide_title
    ? `<text x="300" y="50" text-anchor="middle" class="title">${safeUser.toUpperCase()}</text>`
    : ''
}

<rect x="100" y="60" width="400" height="1" class="cp-accent-fill" fill-opacity="0.3">
  <animate attributeName="y" values="80;320;80" dur="${params.speed || '8s'}" repeatCount="indefinite" />
</rect>
</svg>
`;
}
