// lib/svg/generator.ts

import type { BadgeParams, ContributionCalendar, StreakStats, MonthlyStats } from '../../types';
import { getLabels, type BadgeLabels } from '../i18n/badgeLabels';
import { AUTO_THEME_DARK, AUTO_THEME_LIGHT } from './themes';
import { TOWER_ANIMATION_CSS } from './animations';
import { computeTowers, type TowerData } from './layout';
import { sanitizeFont, sanitizeHexColor, sanitizeRadius, sanitizeGoogleFontUrl } from './sanitizer';

import { SVG_WIDTH, SVG_HEIGHT, FONT_MAP, isFontKey } from './generatorConstants';

// helpers
function truncateUsername(name: string, max = 20): string {
  return name.length > max ? name.slice(0, max) + '…' : name;
}

function getFontFromMap(font: string | null): string | null {
  if (!font) return null;
  const f = font.toLowerCase();
  return isFontKey(f) ? FONT_MAP[f] : null;
}
function getSizeScale(size?: 'small' | 'medium' | 'large'): number {
  if (size === 'small') return 400 / SVG_WIDTH;
  if (size === 'large') return 800 / SVG_WIDTH;
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

function scaleTowerData(towerData: TowerData[], sf: number): TowerData[] {
  if (sf === 1) return towerData;
  return towerData.map((t) => ({
    ...t,
    x: Math.round(t.x * sf),
    y: Math.round(t.y * sf),
    h: t.h * sf,
  }));
}

type Scaler = (n: number) => number;

function createScaler(sf: number): Scaler {
  return (n: number): number => Math.round(n * sf);
}

export function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function particleCount(count: number): number {
  if (count === 0) return 0;
  return Math.min(5, Math.max(3, Math.floor(count / 4)));
}

function generateParticles(
  x: number,
  y: number,
  height: number,
  count: number,
  sf: number,
  autoTheme: boolean = false,
  color: string = ''
): string {
  let particles = '';
  const numParticles = particleCount(count);

  for (let i = 0; i < numParticles; i++) {
    const themeSeed = autoTheme ? 'auto' : color;
    const seed = `${x}:${y}:${height}:${themeSeed}:${count}:${i}`;
    const offsetX = deterministicRandom(`${seed}:offsetX`) * 6 - 3;
    const delay = deterministicRandom(`${seed}:delay`) * 1.5;

    const fillAttr = autoTheme ? 'class="cp-accent-fill"' : `fill="${color}"`;

    particles += `
      <circle ${fillAttr} cx="${x + offsetX}" cy="${y - height}" r="${1.5 * sf}" opacity="1">
        <animate attributeName="cy" from="${y - height}" to="${y - height - 20}" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
      </circle>
    `;
  }
  return `<g class="heat-particles">${particles}</g>`;
}

// ── Section helpers for generateSVG ──────────────────────────────────────

function renderHeader(
  safeUser: string,
  stats: StreakStats,
  sf: number,
  params: BadgeParams
): string {
  const unit = params.mode === 'loc' ? 'lines of code' : 'total contributions';
  const entity = params.org ? 'Organization' : params.repo ? 'Repository' : 'User';
  return `
  <title>CommitPulse ${entity} Stats for ${safeUser}</title>
  <desc>
    ${safeUser} has ${stats.totalContributions} ${unit} and a longest streak of ${stats.longestStreak} days.
  </desc>
  ${renderDefs(sf)}`;
}

function renderDefs(sf: number): string {
  const fs = (n: number): number => Math.round(n * sf * 10) / 10;
  return `<defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${fs(5)}" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
  </defs>`;
}

function renderStatsSection(
  stats: StreakStats,
  labels: BadgeLabels,
  s: Scaler,
  params: BadgeParams
): string {
  const totalLabel = params.mode === 'loc' ? 'TOTAL LINES OF CODE' : labels.ANNUAL_SYNC_TOTAL;

  return `
  <g transform="translate(${s(40)}, ${s(340)})">
    <text class="label">${labels.CURRENT_STREAK}</text>
    <text y="${s(40)}" class="stats" filter="url(#glow)">${stats.currentStreak}</text>
  </g>
  <g transform="translate(${s(300)}, ${s(340)})" text-anchor="middle">
    <text class="label">${totalLabel}</text>
    <text y="${s(40)}" class="total-val" filter="url(#glow)">${stats.totalContributions}</text>
  </g>
  <g transform="translate(${s(560)}, ${s(340)})" text-anchor="end">
    <text class="label">${labels.PEAK_STREAK}</text>
    <text y="${s(40)}" class="stats">${stats.longestStreak}</text>
  </g>`;
}

function renderStyle(
  selectedFont: string | null,
  statsFont: string,
  googleFontsImport: string,
  text: string,
  accent: string,
  sf: number
): string {
  const fs = (n: number) => Math.round(n * sf * 10) / 10;
  return `
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}
  ${TOWER_ANIMATION_CSS}
  .scan-line {
    animation: scan-sweep var(--scan-speed, 8s) linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  @keyframes scan-sweep {
    from { transform: translateY(var(--scan-start, ${fs(20)}px)); }
    to { transform: translateY(var(--scan-end, ${fs(260)}px)); }
  }
  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: ${text}; font-size: ${fs(18)}px; letter-spacing: ${fs(6)}px; font-weight: 400; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: ${text}; font-size: ${fs(42)}px; font-weight: 500; letter-spacing: 0; }
  .total-val { font-family: ${statsFont}; fill: ${accent}; font-size: ${fs(24)}px; font-weight: 500; }
  .label { font-family: "Roboto", sans-serif; fill: ${accent}; font-size: ${fs(11)}px; font-weight: 400; letter-spacing: ${fs(2)}px; opacity: 0.7; }
  @media (prefers-reduced-motion: reduce) {
    .heat-particles { display: none; }
    .scan-line {
      animation: none !important;
      transform: translateY(var(--scan-start, ${fs(20)}px)) !important;
    }
  }
  </style>`;
}

function renderTowers(towerData: TowerData[], accent: string, text: string, sf: number): string {
  let towers = '';
  for (const t of towerData) {
    const color = t.isGhost ? text : accent;
    const delay = ((t.row + t.col) * 0.015).toFixed(3);
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
      towers += generateParticles(t.x, t.y, t.h, t.contributionCount, sf, false, accent);
  }
  return towers;
}

function renderFooter(
  stats: StreakStats,
  params: BadgeParams,
  labels: ReturnType<typeof getLabels>,
  safeUser: string,
  accent: string,
  sf: number
): string {
  const s = createScaler(sf);
  return `
  ${!params.hide_stats ? renderStatsSection(stats, labels, s, params) : ''}
  ${!params.hide_title ? `<text x="${s(300)}" y="${s(50)}" text-anchor="middle" class="title">${truncateUsername(safeUser).toUpperCase()}</text>` : ''}
  <rect
    x="${s(100)}"
    y="${s(60)}"
    width="${s(400)}"
    height="${sf}"
    class="cp-accent-fill scan-line"
    fill-opacity="0.3"
    style="--scan-speed: ${params.speed || '8s'}; --scan-start: ${s(20)}px; --scan-end: ${s(260)}px;"
  />`;
}

// ── Main static-theme renderer ────────────────────────────────────────────

export function generateSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  if (params.autoTheme) return generateAutoThemeSVG(stats, params, calendar);

  const safeUser = escapeXML(params.user || 'GitHub User');
  const bg = `#${sanitizeHexColor(params.bg, '0d1117')}`;
  const accent = `#${sanitizeHexColor(params.accent, '00ffaa')}`;
  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;

  const sanitizedFont = sanitizeFont(params.font);
  const predefinedFont = getFontFromMap(sanitizedFont);
  const isPredefinedFont = Boolean(predefinedFont);
  const selectedFont = isPredefinedFont
    ? predefinedFont
    : sanitizedFont
      ? `"${sanitizedFont}", sans-serif`
      : null;
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const googleFontUrlPart =
    sanitizedFont && !isPredefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const sf = getSizeScale(params.size);
  const radius = sanitizeRadius(params.radius, 8) * sf;
  const labels = getLabels(params.lang);
  const W = Math.round(SVG_WIDTH * sf);
  const H = Math.round(SVG_HEIGHT * sf);

  const towerData = scaleTowerData(
    computeTowers(calendar, params.scale, stats.todayDate, params.mode),
    sf
  );
  const towers = renderTowers(towerData, accent, text, sf);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img">
  ${renderHeader(safeUser, stats, sf, params)}
  ${renderStyle(selectedFont, statsFont, googleFontsImport, text, accent, sf)}
  <rect width="${W}" height="${H}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bg}" />
  <g transform="translate(0, ${Math.round(20 * sf)})">${towers}</g>
  ${renderFooter(stats, params, labels, safeUser, accent, sf)}
</svg>`;
}

function generateAutoThemeSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  const light = AUTO_THEME_LIGHT;
  const dark = AUTO_THEME_DARK;
  const safeUser = escapeXML(params.user || 'GitHub User');
  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = sanitizedFont
    ? getFontFromMap(sanitizedFont) || `"${sanitizedFont}", sans-serif`
    : null;
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const sf = getSizeScale(params.size);
  const radius = sanitizeRadius(params.radius, 8) * sf;
  const labels = getLabels(params.lang);

  const W = Math.round(SVG_WIDTH * sf);
  const H = Math.round(SVG_HEIGHT * sf);
  const towerData = scaleTowerData(
    computeTowers(calendar, params.scale, stats.todayDate, params.mode),
    sf
  );
  let towers = '';

  for (const t of towerData) {
    const fillClass = t.isGhost ? 'cp-text-fill' : 'cp-accent-fill';
    const strokeColor = t.isGhost ? 'var(--cp-text)' : 'var(--cp-accent)';
    const delay = ((t.row + t.col) * 0.015).toFixed(3);

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
      towers += generateParticles(t.x, t.y, t.h, t.contributionCount, sf, true);
  }

  const s = createScaler(sf);
  const fs = (n: number): number => Math.round(n * sf * 10) / 10;

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${W}"
  height="${H}"
  viewBox="0 0 ${W} ${H}"
  fill="none"
  role="img"
>
  ${renderHeader(safeUser, stats, sf, params)}

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; } }
  .cp-bg-fill { fill: var(--cp-bg); } .cp-text-fill { fill: var(--cp-text); color: var(--cp-text); } .cp-accent-fill { fill: var(--cp-accent); color: var(--cp-accent); }
  ${TOWER_ANIMATION_CSS}
  .scan-line {
    animation: scan-sweep var(--scan-speed, 8s) linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  @keyframes scan-sweep {
    from { transform: translateY(var(--scan-start, ${s(20)}px)); }
    to { transform: translateY(var(--scan-end, ${s(260)}px)); }
  }
  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: var(--cp-text); font-size: ${fs(18)}px; letter-spacing: ${fs(6)}px; font-weight: 400; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: var(--cp-text); font-size: ${fs(42)}px; font-weight: 500; letter-spacing: 0; }
  .total-val { font-family: ${statsFont}; fill: var(--cp-accent); font-size: ${fs(24)}px; font-weight: 500; }
  .label { font-family: "Roboto", sans-serif; fill: var(--cp-accent); font-size: ${fs(11)}px; font-weight: 400; letter-spacing: ${fs(2)}px; opacity: 0.7; }

  @media (prefers-reduced-motion: reduce) {
    .heat-particles { display: none; }
    .scan-line {
      animation: none !important;
      transform: translateY(var(--scan-start, ${s(20)}px)) !important;
    }
  }
  </style>

  <rect width="${W}" height="${H}" rx="${radius}" ${params.hideBackground ? 'fill="transparent"' : 'class="cp-bg-fill"'} />
  <g transform="translate(0, ${s(20)})">
    ${towers}
  </g>
  ${!params.hide_stats ? renderStatsSection(stats, labels, s, params) : ''}
${
  !params.hide_title
    ? `<text x="${s(300)}" y="${s(50)}" text-anchor="middle" class="title">${truncateUsername(safeUser).toUpperCase()}</text>`
    : ''
}

  <rect
    x="${s(100)}"
    y="${s(60)}"
    width="${s(400)}"
    height="${sf}"
    class="cp-accent-fill scan-line"
    fill-opacity="0.3"
    style="--scan-speed: ${params.speed || '8s'}; --scan-start: ${s(20)}px; --scan-end: ${s(260)}px;"
  />
</svg>
`;
}

export function generateMonthlySVG(stats: MonthlyStats, params: BadgeParams): string {
  if (params.autoTheme) {
    return generateAutoThemeMonthlySVG(stats, params);
  }

  const safeUser = escapeXML(params.user || 'GitHub User');
  const bg = `#${sanitizeHexColor(params.bg, '0d1117')}`;
  const accent = `#${sanitizeHexColor(params.accent, '00ffaa')}`;
  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;

  const sanitizeFont = (name: string) => name.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  const sanitizedFont = params.font ? sanitizeFont(params.font) : null;
  const predefinedFont = getFontFromMap(sanitizedFont);
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

  const width = params.width || 300;
  const height = params.height || 120;

  const googleFontUrlPart =
    sanitizedFont && !isPredefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const commitsLabel = params.mode === 'loc' ? 'LINES THIS MONTH' : labels.COMMITS_THIS_MONTH;
  const deltaUnit = params.mode === 'loc' ? 'lines' : 'commits';

  let deltaText = '';
  if (params.delta_format === 'absolute') {
    deltaText =
      stats.deltaAbsolute > 0
        ? `+${stats.deltaAbsolute} ${deltaUnit}`
        : stats.deltaAbsolute === 0
          ? `0 ${deltaUnit}`
          : `${stats.deltaAbsolute} ${deltaUnit}`;
  } else if (params.delta_format === 'both') {
    deltaText =
      stats.deltaPercentage === null
        ? `N/A (${stats.deltaAbsolute > 0 ? '+' : ''}${stats.deltaAbsolute})`
        : stats.deltaPercentage > 0
          ? `+${stats.deltaPercentage}% (+${stats.deltaAbsolute})`
          : stats.deltaPercentage < 0
            ? `${stats.deltaPercentage}% (${stats.deltaAbsolute})`
            : `0% (${stats.deltaAbsolute > 0 ? '+' : ''}${stats.deltaAbsolute})`;
  } else {
    deltaText =
      stats.deltaPercentage === null
        ? 'N/A'
        : stats.deltaPercentage > 0
          ? `+${stats.deltaPercentage}%`
          : stats.deltaPercentage < 0
            ? `${stats.deltaPercentage}%`
            : `0%`;
  }
  const deltaColor = stats.deltaAbsolute >= 0 ? accent : '#ff4444';

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  fill="none"
  role="img"
>
  <title>Monthly Stats for ${safeUser}</title>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}

  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: ${text}; font-size: 14px; letter-spacing: 2px; font-weight: 400; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: ${accent}; font-size: 36px; font-weight: 600; letter-spacing: 0; }
  .label { font-family: "Roboto", sans-serif; fill: ${text}; font-size: 10px; font-weight: 400; letter-spacing: 1px; opacity: 0.7; }
  .delta { font-family: "Roboto", sans-serif; fill: ${deltaColor}; font-size: 12px; font-weight: 500; }
  </style>

  <rect width="${width}" height="${height}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bg}" />

  <text x="20" y="40" class="title">${stats.currentMonthName.toUpperCase()}</text>
  <text x="20" y="85" class="stats">${stats.currentMonthTotal}</text>
  <text x="20" y="105" class="label">${commitsLabel}</text>

  <g transform="translate(${width - 20}, 80)" text-anchor="end">
    <text class="delta">${deltaText}</text>
    <text y="20" class="label">${labels.VS_LAST_MONTH}</text>
  </g>
</svg>
`;
}

function generateAutoThemeMonthlySVG(stats: MonthlyStats, params: BadgeParams): string {
  const light = AUTO_THEME_LIGHT;
  const dark = AUTO_THEME_DARK;
  const safeUser = escapeXML(params.user || 'GitHub User');
  const sanitizeFont = (name: string) => name.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  const sanitizedFont = params.font ? sanitizeFont(params.font) : null;
  const predefinedFont = getFontFromMap(sanitizedFont);
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

  const width = params.width || 300;
  const height = params.height || 120;

  const commitsLabel = params.mode === 'loc' ? 'LINES THIS MONTH' : labels.COMMITS_THIS_MONTH;
  const deltaUnit = params.mode === 'loc' ? 'lines' : 'commits';

  let deltaText = '';
  if (params.delta_format === 'absolute') {
    deltaText =
      stats.deltaAbsolute > 0
        ? `+${stats.deltaAbsolute} ${deltaUnit}`
        : stats.deltaAbsolute === 0
          ? `0 ${deltaUnit}`
          : `${stats.deltaAbsolute} ${deltaUnit}`;
  } else if (params.delta_format === 'both') {
    deltaText =
      stats.deltaPercentage === null
        ? `N/A (${stats.deltaAbsolute > 0 ? '+' : ''}${stats.deltaAbsolute})`
        : stats.deltaPercentage > 0
          ? `+${stats.deltaPercentage}% (+${stats.deltaAbsolute})`
          : stats.deltaPercentage < 0
            ? `${stats.deltaPercentage}% (${stats.deltaAbsolute})`
            : `0% (${stats.deltaAbsolute > 0 ? '+' : ''}${stats.deltaAbsolute})`;
  } else {
    deltaText =
      stats.deltaPercentage === null
        ? 'N/A'
        : stats.deltaPercentage > 0
          ? `+${stats.deltaPercentage}%`
          : stats.deltaPercentage < 0
            ? `${stats.deltaPercentage}%`
            : `0%`;
  }

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  fill="none"
  role="img"
>
  <title>Monthly Stats for ${safeUser}</title>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; --cp-negative: #ff4444; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; --cp-negative: #ff6666; } }
  .cp-bg-fill { fill: var(--cp-bg); } 
  .cp-text-fill { fill: var(--cp-text); color: var(--cp-text); } 
  .cp-accent-fill { fill: var(--cp-accent); color: var(--cp-accent); }
  .cp-delta-fill { fill: ${stats.deltaAbsolute >= 0 ? 'var(--cp-accent)' : 'var(--cp-negative)'}; }
  
  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: var(--cp-text); font-size: 14px; letter-spacing: 2px; font-weight: 400; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: var(--cp-accent); font-size: 36px; font-weight: 600; letter-spacing: 0; }
  .label { font-family: "Roboto", sans-serif; fill: var(--cp-text); font-size: 10px; font-weight: 400; letter-spacing: 1px; opacity: 0.7; }
  .delta { font-family: "Roboto", sans-serif; font-size: 12px; font-weight: 500; }
  </style>

  <rect width="${width}" height="${height}" rx="${radius}" ${params.hideBackground ? 'fill="transparent"' : 'class="cp-bg-fill"'} />

  <text x="20" y="40" class="title">${stats.currentMonthName.toUpperCase()}</text>
  <text x="20" y="85" class="stats">${stats.currentMonthTotal}</text>
  <text x="20" y="105" class="label">${commitsLabel}</text>

  <g transform="translate(${width - 20}, 80)" text-anchor="end">
    <text class="delta cp-delta-fill">${deltaText}</text>
    <text y="20" class="label">${labels.VS_LAST_MONTH}</text>
  </g>
</svg>
`;
}

/**
 * Generates a fallback SVG badge for users that do not exist
 * or when contribution data cannot be loaded.
 *
 * The SVG renders a ghost-style city layout with an animated
 * error-state design while preserving the standard badge layout.
 *
 * @param username - GitHub username displayed in the error badge.
 * @param bg - Background color used for the SVG container.
 * @param accent - Accent color used for highlights, outlines,
 * and animated elements.
 * @param text - Primary text color used throughout the badge.
 * @param radius - Border radius applied to the SVG background.
 * @param speed - Animation speed for the radar scan effect.
 * Defaults to '8s'.
 *
 * @returns A generated SVG string representing the not-found state.
 *
 * @example
 * const svg = generateNotFoundSVG(
 *   'octocat',
 *   '#0d1117',
 *   '#00ffaa',
 *   '#ffffff',
 *   8,
 *   '8s'
 * );
 */
// Fixed isometric tower layout for the not-found ghost city.
// Heights are deterministic so the silhouette always looks like a real city
// regardless of the username or theme passed to generateNotFoundSVG.
const GHOST_LAYOUT: { col: number; row: number; h: number }[] = [
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

export function generateNotFoundSVG(
  username: string,
  bg: string,
  accent: string,
  text: string,
  radius: number,
  speed: string = '8s'
): string {
  const safeName = escapeXML(username.toUpperCase());
  let ghostTowers = '';
  for (const { col, row, h } of GHOST_LAYOUT) {
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
  width="${SVG_WIDTH}"
  height="${SVG_HEIGHT}"
  viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}"
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
    .scan-line { animation: scan-sweep var(--scan-speed, 8s) linear infinite; }
    @keyframes gp { 0%,100%{opacity:.55} 50%{opacity:1} }
    @keyframes scan-sweep { from { transform: translateY(20px); } to { transform: translateY(260px); } }
    @media (prefers-reduced-motion: reduce) {
      .ghost-pulse { animation: none; }
      .scan-line {
        animation: none !important;
        transform: translateY(20px) !important;
      }
    }
  </style>

  <!-- Background -->
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="${radius}" fill="${bg}"/>

  <!-- Ghost isometric city — same grid as real badge -->
  <g transform="translate(0, 20)" class="ghost-pulse">
    ${ghostTowers}
  </g>

  <!-- Fade overlay so ghost city dissolves into background -->
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="${radius}" fill="url(#ghostFade)"/>

  <!-- Radar scan line -->
  <rect x="100" y="60" width="400" height="1" class="scan-line" fill="${accent}" fill-opacity="0.12" style="--scan-speed: ${speed};"/>

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

  <text x="300" y="278" text-anchor="middle"
    font-family="Space Grotesk, sans-serif" font-size="11"
    fill="${text}" opacity="0.3">
    This GitHub user doesn't exist
  </text>

  <!-- Bottom stat placeholders -->
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
