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
function getSizeScale(size?: 'small' | 'medium' | 'large'): number {
  if (size === 'small') return 400 / 600;
  if (size === 'large') return 800 / 600;
  return 1; // medium (default)
}

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
  todayDate: string,
  sf: number = 1
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
        x: Math.round((300 + (i - j) * 16) * sf),
        y: Math.round((120 + (i + j) * 9) * sf),
        h: computeTowerHeight(day.contributionCount, scale, shouldShowGhostCity) * sf,
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

export function escapeXML(str: string): string {
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
  count: number,
  sf: number
): string {
  let particles = '';
  const particleCount = Math.min(5, Math.max(3, Math.floor(count / 4)));

  for (let i = 0; i < particleCount; i++) {
    const seed = `${x}:${y}:${height}:${color}:${count}:${i}`;
    const offsetX = deterministicRandom(`${seed}:offsetX`) * 6 - 3;
    const delay = deterministicRandom(`${seed}:delay`) * 1.5;

    particles += `
      <circle cx="${x + offsetX}" cy="${y - height}" r="${1.5 * sf}" fill="${color}" opacity="1">
        <animate attributeName="cy" from="${y - height}" to="${y - height - 20}" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
      </circle>
    `;
  }
  return `<g class="heat-particles">${particles}</g>`;
}

function generateAutoParticles(
  x: number,
  y: number,
  height: number,
  count: number,
  sf: number
): string {
  let particles = '';
  const particleCount = Math.min(5, Math.max(3, Math.floor(count / 4)));

  for (let i = 0; i < particleCount; i++) {
    const seed = `${x}:${y}:${height}:auto:${count}:${i}`;
    const offsetX = deterministicRandom(`${seed}:offsetX`) * 6 - 3;
    const delay = deterministicRandom(`${seed}:delay`) * 1.5;

    particles += `
      <circle class="cp-accent-fill" cx="${x + offsetX}" cy="${y - height}" r="${1.5 * sf}" opacity="1">
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
  const sf = getSizeScale(params.size);
  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50)) * sf;
  const labels = getLabels(params.lang);

  const W = Math.round(600 * sf);
  const H = Math.round(420 * sf);
  const towerData = computeTowers(calendar, params.scale, stats.todayDate, sf);
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
      towers += generateParticles(t.x, t.y, t.h, accent, t.contributionCount, sf);
  }

  // dynamic google fonts import
  const googleFontsImport =
    sanitizedFont && !isPredefinedFont
      ? `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(sanitizedFont).replace(/%20/g, '+')}&amp;display=swap');`
      : '';

  const s = (n: number) => Math.round(n * sf);
  const fs = (n: number) => Math.round(n * sf * 10) / 10;

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${W}"
  height="${H}"
  viewBox="0 0 ${W} ${H}"
  fill="none"
  role="img"
>
  <title>CommitPulse Stats for ${safeUser}</title>
  <desc>
    ${params.user || 'This user'} has ${stats.totalContributions} total contributions and a longest streak of ${stats.longestStreak} days.
  </desc>
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${fs(5)}" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
  </defs>

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;display=swap');
  ${googleFontsImport}
  ${TOWER_ANIMATION_CSS}

  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: ${text}; font-size: ${fs(18)}px; letter-spacing: ${fs(6)}px; font-weight: 400; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: ${text}; font-size: ${fs(42)}px; font-weight: 500; letter-spacing: 0; }
  .total-val { font-family: ${statsFont}; fill: ${accent}; font-size: ${fs(24)}px; font-weight: 500; }
  .label { font-family: "Roboto", sans-serif; fill: ${accent}; font-size: ${fs(11)}px; font-weight: 400; letter-spacing: ${fs(2)}px; opacity: 0.7; }

  @media (prefers-reduced-motion: reduce) { .heat-particles { display: none; } }
  </style>

  <rect width="${W}" height="${H}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bg}" />

  <g transform="translate(0, ${s(20)})">${towers}</g>
  ${
    !params.hide_stats
      ? `
  <g transform="translate(${s(40)}, ${s(340)})">
    <text class="label">${labels.CURRENT_STREAK}</text>
    <text y="${s(40)}" class="stats" filter="url(#glow)">${stats.currentStreak}</text>
  </g>

  <g transform="translate(${s(300)}, ${s(340)})" text-anchor="middle">
    <text class="label">${labels.ANNUAL_SYNC_TOTAL}</text>
    <text y="${s(40)}" class="total-val" filter="url(#glow)">${stats.totalContributions}</text>
  </g>

  <g transform="translate(${s(560)}, ${s(340)})" text-anchor="end">
    <text class="label">${labels.PEAK_STREAK}</text>
    <text y="${s(40)}" class="stats">${stats.longestStreak}</text>
  </g>
`
      : ''
  }
${
  !params.hide_title
    ? `<text x="${s(300)}" y="${s(50)}" text-anchor="middle" class="title">${safeUser.toUpperCase()}</text>`
    : ''
}

  <rect x="${s(100)}" y="${s(60)}" width="${s(400)}" height="${sf}" fill="${accent}" fill-opacity="0.3">
    <animate attributeName="y" values="${s(80)};${s(320)};${s(80)}" dur="${params.speed || '8s'}" repeatCount="indefinite" />
  </rect>
</svg>
`;
}

//generates an svg for the non existent users
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
  const sf = getSizeScale(params.size);
  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50)) * sf;
  const labels = getLabels(params.lang);

  const W = Math.round(600 * sf);
  const H = Math.round(420 * sf);
  const towerData = computeTowers(calendar, params.scale, stats.todayDate, sf);
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
      towers += generateAutoParticles(t.x, t.y, t.h, t.contributionCount, sf);
  }

  const s = (n: number) => Math.round(n * sf);
  const fs = (n: number) => Math.round(n * sf * 10) / 10;

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${W}"
  height="${H}"
  viewBox="0 0 ${W} ${H}"
  fill="none"
  role="img"
>
  <title>CommitPulse Stats for ${safeUser} </title>
  <desc>
    ${params.user || 'This user'} has ${stats.totalContributions} total contributions and a longest streak of ${stats.longestStreak} days.
  </desc>
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${fs(5)}" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
  </defs>

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;display=swap');
  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; } }
  .cp-bg-fill { fill: var(--cp-bg); } .cp-text-fill { fill: var(--cp-text); color: var(--cp-text); } .cp-accent-fill { fill: var(--cp-accent); color: var(--cp-accent); }
  ${TOWER_ANIMATION_CSS}
  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: var(--cp-text); font-size: ${fs(18)}px; letter-spacing: ${fs(6)}px; font-weight: 400; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: var(--cp-text); font-size: ${fs(42)}px; font-weight: 500; letter-spacing: 0; }
  .total-val { font-family: ${statsFont}; fill: var(--cp-accent); font-size: ${fs(24)}px; font-weight: 500; }
  .label { font-family: "Roboto", sans-serif; fill: var(--cp-accent); font-size: ${fs(11)}px; font-weight: 400; letter-spacing: ${fs(2)}px; opacity: 0.7; }

  @media (prefers-reduced-motion: reduce) { .heat-particles { display: none; } }
  </style>

  <rect width="${W}" height="${H}" rx="${radius}" ${params.hideBackground ? 'fill="transparent"' : 'class="cp-bg-fill"'} />
  <g transform="translate(0, ${s(20)})">
    ${towers}
  </g>
  ${
    !params.hide_stats
      ? `
  <g transform="translate(${s(40)}, ${s(340)})">
    <text class="label">${labels.CURRENT_STREAK}</text>
    <text y="${s(40)}" class="stats" filter="url(#glow)">${stats.currentStreak}</text>
  </g>

  <g transform="translate(${s(300)}, ${s(340)})" text-anchor="middle">
    <text class="label">${labels.ANNUAL_SYNC_TOTAL}</text>
    <text y="${s(40)}" class="total-val" filter="url(#glow)">${stats.totalContributions}</text>
  </g>

  <g transform="translate(${s(560)}, ${s(340)})" text-anchor="end">
    <text class="label">${labels.PEAK_STREAK}</text>
    <text y="${s(40)}" class="stats">${stats.longestStreak}</text>
  </g>
`
      : ''
  }
${
  !params.hide_title
    ? `<text x="${s(300)}" y="${s(50)}" text-anchor="middle" class="title">${safeUser.toUpperCase()}</text>`
    : ''
}

  <rect x="${s(100)}" y="${s(60)}" width="${s(400)}" height="${sf}" class="cp-accent-fill" fill-opacity="0.3">
    <animate attributeName="y" values="${s(80)};${s(320)};${s(80)}" dur="${params.speed || '8s'}" repeatCount="indefinite" />
  </rect>
</svg>
`;
}

export function generateNotFoundSVG(
  username: string,
  bg: string,
  accent: string,
  text: string,
  radius: number,
  speed: string = '8s'
): string {
  const safeName = escapeXML(username.toUpperCase());

  // Ghost towers — same isometric math as computeTowers() but with fixed
  // deterministic heights so the silhouette looks like a real city.
  const ghostLayout: { col: number; row: number; h: number }[] = [
    { col: 0, row: 0, h: 8 },
    { col: 1, row: 0, h: 20 },
    { col: 2, row: 0, h: 12 },
    { col: 3, row: 0, h: 30 },
    { col: 4, row: 0, h: 16 },
    { col: 5, row: 0, h: 10 },
    { col: 6, row: 0, h: 24 },
    { col: 7, row: 0, h: 8 },

    { col: 0, row: 1, h: 6 },
    { col: 1, row: 1, h: 14 },
    { col: 2, row: 1, h: 36 },
    { col: 3, row: 1, h: 22 },
    { col: 4, row: 1, h: 44 },
    { col: 5, row: 1, h: 18 },
    { col: 6, row: 1, h: 10 },
    { col: 7, row: 1, h: 28 },

    { col: 0, row: 2, h: 10 },
    { col: 1, row: 2, h: 26 },
    { col: 2, row: 2, h: 16 },
    { col: 3, row: 2, h: 38 },
    { col: 4, row: 2, h: 20 },
    { col: 5, row: 2, h: 32 },
    { col: 6, row: 2, h: 14 },
    { col: 7, row: 2, h: 6 },

    { col: 0, row: 3, h: 4 },
    { col: 1, row: 3, h: 18 },
    { col: 2, row: 3, h: 28 },
    { col: 3, row: 3, h: 12 },
    { col: 4, row: 3, h: 34 },
    { col: 5, row: 3, h: 8 },
    { col: 6, row: 3, h: 22 },
    { col: 7, row: 3, h: 16 },

    { col: 0, row: 4, h: 8 },
    { col: 1, row: 4, h: 30 },
    { col: 2, row: 4, h: 10 },
    { col: 3, row: 4, h: 20 },
    { col: 4, row: 4, h: 16 },
    { col: 5, row: 4, h: 40 },
    { col: 6, row: 4, h: 12 },
    { col: 7, row: 4, h: 24 },

    { col: 0, row: 5, h: 14 },
    { col: 1, row: 5, h: 8 },
    { col: 2, row: 5, h: 22 },
    { col: 3, row: 5, h: 32 },
    { col: 4, row: 5, h: 10 },
    { col: 5, row: 5, h: 18 },
    { col: 6, row: 5, h: 28 },
    { col: 7, row: 5, h: 6 },
  ];

  let ghostTowers = '';
  for (const { col, row, h } of ghostLayout) {
    const tx = 300 + (col - row) * 16;
    const ty = 120 + (col + row) * 9;

    ghostTowers += `
      <g transform="translate(${tx}, ${ty - h})">
        <path d="M0 10 L0 ${10 + h} L-16 ${h} L-16 0 Z"
          fill="${accent}" fill-opacity="0.08"
          stroke="${accent}" stroke-opacity="0.18" stroke-width="0.5"/>
        <path d="M0 10 L0 ${10 + h} L16 ${h} L16 0 Z"
          fill="${accent}" fill-opacity="0.05"
          stroke="${accent}" stroke-opacity="0.12" stroke-width="0.5"/>
        <path d="M0 0 L16 10 L0 20 L-16 10 Z"
          fill="${accent}" fill-opacity="0.14"
          stroke="${accent}" stroke-opacity="0.22" stroke-width="0.5"/>
      </g>`;
  }

  return `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="600"
  height="420"
  viewBox="0 0 600 420"
  fill="none"
  role="img"
>
  <title>User not found — ${safeName}</title>
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="softglow" x="-80%" y="-80%" width="360%" height="360%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <!-- Fade the ghost city out toward the bottom -->
    <linearGradient id="ghostFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="30%" stop-color="${bg}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="1"/>
    </linearGradient>
  </defs>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600&amp;display=swap');
    .title  { font-family: "Syncopate", sans-serif; fill: ${text}; font-size: 18px; letter-spacing: 6px; font-weight: 400; opacity: 0.5; }
    .label  { font-family: "Roboto", sans-serif; fill: ${accent}; font-size: 11px; letter-spacing: 2px; opacity: 0.4; }
    .stats  { font-family: "Space Grotesk", sans-serif; fill: ${text}; font-size: 42px; font-weight: 500; opacity: 0.2; }
    .ghost-pulse { animation: gp 2.6s ease-in-out infinite; }
    @keyframes gp { 0%,100%{opacity:.55} 50%{opacity:1} }
    @media (prefers-reduced-motion: reduce) { .ghost-pulse { animation: none; } }
  </style>

  <!-- Background -->
  <rect width="600" height="420" rx="${radius}" fill="${bg}"/>

  <!-- Ghost isometric city — same grid as real badge -->
  <g transform="translate(0, 20)" class="ghost-pulse">
    ${ghostTowers}
  </g>

  <!-- Fade overlay so ghost city dissolves into background -->
  <rect width="600" height="420" rx="${radius}" fill="url(#ghostFade)"/>

  <!-- Radar scan line (same as real badge, but very faint) -->
  <rect x="100" y="60" width="400" height="1" fill="${accent}" fill-opacity="0.12">
    <animate attributeName="y" values="80;320;80" dur="${speed}" repeatCount="indefinite"/>
  </rect>

  <!-- Username label (same position as real badge) -->
  <text x="300" y="50" text-anchor="middle" class="title">${safeName}</text>

  <!-- Divider below title -->
  <rect x="180" y="62" width="240" height="1" fill="${accent}" fill-opacity="0.15"/>

  <!-- Central error mark -->
  <circle cx="300" cy="190" r="32" fill="none"
    stroke="${accent}" stroke-width="1.2" stroke-opacity="0.3" filter="url(#softglow)"/>
  <line x1="286" y1="176" x2="314" y2="204"
    stroke="${accent}" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.55"/>
  <line x1="314" y1="176" x2="286" y2="204"
    stroke="${accent}" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.55"/>

  <!-- "NOT FOUND" badge -->
  <rect x="230" y="235" width="140" height="22" rx="4"
    fill="${accent}" fill-opacity="0.08"
    stroke="${accent}" stroke-width="0.8" stroke-opacity="0.25"/>
  <text x="300" y="250" text-anchor="middle"
    font-family="Syncopate, sans-serif" font-size="9" font-weight="700"
    fill="${accent}" opacity="0.7" letter-spacing="4">NOT FOUND</text>

  <!-- Sub-hint -->
  <text x="300" y="278" text-anchor="middle"
    font-family="Space Grotesk, sans-serif" font-size="11"
    fill="${text}" opacity="0.3">
    This GitHub user doesn't exist
  </text>

  <!-- Bottom stat placeholders (same layout as real badge, greyed out) -->
  <g transform="translate(40, 340)">
    <text class="label">CURRENT_STREAK</text>
    <text y="40" class="stats">—</text>
  </g>
  <g transform="translate(300, 340)" text-anchor="middle">
    <text class="label">ANNUAL_SYNC_TOTAL</text>
    <text y="40" font-family="Space Grotesk,sans-serif" font-size="24"
      fill="${accent}" opacity="0.2">—</text>
  </g>
  <g transform="translate(560, 340)" text-anchor="end">
    <text class="label">PEAK_STREAK</text>
    <text y="40" class="stats">—</text>
  </g>
</svg>`;
}
