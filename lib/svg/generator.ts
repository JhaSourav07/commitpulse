import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';
import { AUTO_DARK_THEME, AUTO_LIGHT_THEME } from './themes';
import { TOWER_ANIMATION_CSS } from './animations';
import { computeTowers } from './layout';

const FONT_MAP: Record<string, string> = {
  jetbrains: '"JetBrains Mono", monospace',
  fira: '"Fira Code", monospace',
  roboto: '"Roboto", sans-serif',
};

// helpers
function deterministicRandom(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
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

  const sanitizeFont = (name: string) => name.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
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
    <text class="label">CURRENT_STREAK</text>
    <text y="40" class="stats" filter="url(#glow)">${stats.currentStreak}</text>
  </g>

  <g transform="translate(300, 340)" text-anchor="middle">
    <text class="label">ANNUAL_SYNC_TOTAL</text>
    <text y="40" class="total-val" filter="url(#glow)">${stats.totalContributions}</text>
  </g>

  <g transform="translate(560, 340)" text-anchor="end">
    <text class="label">PEAK_STREAK</text>
    <text y="40" class="stats">${stats.longestStreak}</text>
  </g>
  `
      : ''
  }
  <text x="300" y="50" text-anchor="middle" class="title">${safeUser.toUpperCase()}</text>

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
  const selectedFont = params.font
    ? FONT_MAP[params.font.toLowerCase()] || '"JetBrains Mono", monospace'
    : null;
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50));

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
    <text class="label">CURRENT_STREAK</text>
    <text y="40" class="stats" filter="url(#glow)">${stats.currentStreak}</text>
  </g>

  <g transform="translate(300, 340)" text-anchor="middle">
    <text class="label">ANNUAL_SYNC_TOTAL</text>
    <text y="40" class="total-val" filter="url(#glow)">${stats.totalContributions}</text>
  </g>

  <g transform="translate(560, 340)" text-anchor="end">
    <text class="label">PEAK_STREAK</text>
    <text y="40" class="stats">${stats.longestStreak}</text>
  </g>
  `
      : ''
  }
  <text x="300" y="50" text-anchor="middle" class="title">${safeUser.toUpperCase()}</text>

  <rect x="100" y="60" width="400" height="1" class="cp-accent-fill" fill-opacity="0.3">
    <animate attributeName="y" values="80;320;80" dur="${params.speed || '8s'}" repeatCount="indefinite" />
  </rect>
</svg>
`;
}
