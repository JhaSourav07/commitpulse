// lib/svg/generator.ts

import type { BadgeParams, ContributionCalendar, StreakStats, MonthlyStats } from '../../types';
import { getLabels, type BadgeLabels } from '../i18n/badgeLabels';
import { AUTO_THEME_DARK, AUTO_THEME_LIGHT, themes } from './themes';
import { getTowerAnimationCSS } from './animations';
import { computeTowers, type TowerData } from './layout';
import {
  sanitizeFont,
  sanitizeHexColor,
  sanitizeRadius,
  sanitizeGoogleFontUrl,
  getLuminance,
} from './sanitizer';

import { SVG_WIDTH, SVG_HEIGHT, FONT_MAP } from './generatorConstants';

// helpers
export function getSizeScale(size?: 'small' | 'medium' | 'large') {
  if (size === 'small') return 400 / SVG_WIDTH;
  if (size === 'large') return 800 / SVG_WIDTH;
  return 1;
}

export function truncateUsername(username: string): string {
  return username.length > 12 ? `${username.slice(0, 12)}...` : username;
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
      <circle ${fillAttr} cx="${x + offsetX}" cy="${y - height}" r="${1.5 * sf}" opacity="1" pointer-events="none">
        <animate attributeName="cy" from="${y - height}" to="${y - height - Math.round(20 * sf)}" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
      </circle>
    `;
  }
  return `<g class="heat-particles" pointer-events="none">${particles}</g>`;
}

export function getInteractiveTowerCSS(accentColorExpr: string): string {
  return `
  .interactive-tower { transition: transform 0.2s ease, filter 0.2s ease; cursor: pointer; }
  .interactive-tower:hover { transform: translateY(-4px); filter: brightness(1.2) drop-shadow(0 4px 8px ${accentColorExpr}); }
  `;
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
  ${renderDefs(sf, params)}`;
}

function renderDefs(sf: number, params: BadgeParams): string {
  const fs = (n: number): number => Math.round(n * sf * 10) / 10;

  let gradients = '';
  if (params.gradient) {
    if (params.autoTheme) {
      for (let i = 0; i < 4; i++) {
        const level = i + 1;
        gradients += `
      <linearGradient id="tower-grad-level-${level}" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="var(--cp-bg)" stop-opacity="0.1" />
        <stop offset="100%" stop-color="var(--cp-accent)" stop-opacity="${0.4 + i * 0.2}" />
      </linearGradient>`;
      }
    } else {
      const accent = params.accent;
      const colors = Array.isArray(accent)
        ? [0, 1, 2, 3].map((i) => {
            const idx = Math.min(i, accent.length - 1);
            const c = accent[idx] || accent[accent.length - 1] || '00ffaa';
            return c.startsWith('#') ? c : `#${c}`;
          })
        : [0, 1, 2, 3].map(() => (String(accent).startsWith('#') ? String(accent) : `#${accent}`));

      const bgStr = params.bg || '0d1117';
      const bgHex = bgStr.startsWith('#') ? bgStr : `#${bgStr}`;

      colors.forEach((c, idx) => {
        const level = idx + 1;
        gradients += `
      <linearGradient id="tower-grad-level-${level}" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="${bgHex}" stop-opacity="0.1" />
        <stop offset="100%" stop-color="${c}" stop-opacity="${0.4 + idx * 0.2}" />
      </linearGradient>`;
      });
    }
  }

  return `<defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${fs(5)}" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
    ${gradients}
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
  <g transform="translate(${s(100)}, ${s(340)})" text-anchor="middle">
    <text class="label">${labels.CURRENT_STREAK}</text>
    <text y="${s(40)}" class="stats" filter="url(#glow)">${stats.currentStreak}</text>
  </g>
  <g transform="translate(${s(300)}, ${s(340)})" text-anchor="middle">
    <text class="label">${totalLabel}</text>
    <text y="${s(40)}" class="total-val" filter="url(#glow)">${stats.totalContributions}</text>
  </g>
  <g transform="translate(${s(500)}, ${s(340)})" text-anchor="middle">
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
  sf: number,
  bg: string,
  entrance: 'rise' | 'fade' | 'slide' | 'none' = 'rise'
): string {
  const fs = (n: number) => Math.round(n * sf * 10) / 10;
  const isLightBg = getLuminance(bg) > 0.5;
  const labelFill = isLightBg ? text : accent;
  const labelOpacity = isLightBg ? 0.8 : 0.7;

  return `
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}
  ${getTowerAnimationCSS(entrance)}
  .scan-line {
    animation: scan-sweep var(--scan-speed, 8s) linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  @keyframes scan-sweep {
    from { transform: translateY(var(--scan-start, ${fs(0)}px)); }
    to { transform: translateY(var(--scan-end, ${fs(240)}px)); }
  }
  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: ${text}; font-size: ${fs(18)}px; letter-spacing: ${fs(6)}px; font-weight: 400; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: ${text}; font-size: ${fs(42)}px; font-weight: 500; letter-spacing: 0; }
  .total-val { font-family: ${statsFont}; fill: ${accent}; font-size: ${fs(24)}px; font-weight: 500; }
  .label { font-family: "Roboto", sans-serif; fill: ${labelFill}; font-size: ${fs(11)}px; font-weight: 400; letter-spacing: ${fs(2)}px; opacity: ${labelOpacity}; }
  @media (prefers-reduced-motion: reduce) {
    .heat-particles { display: none; }
    .scan-line {
      animation: none !important;
      transition: none !important;
      transform: translateY(var(--scan-start, ${fs(0)}px)) !important;
    }
  }
  .isometric-label { font-family: ${selectedFont || '"Roboto", sans-serif'}; font-size: ${fs(10)}px; font-weight: 400; letter-spacing: 1px; fill-opacity: 0.6; }
  ${getInteractiveTowerCSS(`${accent}66`)}
  </style>`;
}

function renderTowers(
  towerData: TowerData[],
  params: BadgeParams,
  accent: string | string[],
  text: string,
  sf: number,
  isAutoTheme: boolean = false
): string {
  let towers = '';
  const opacityMultipliers = [0.4, 0.6, 0.8, 1.0];

  // Parse highlight date strings if provided (Format: YYYY-MM-DD:YYYY-MM-DD)
  let highlightStart: number | null = null;
  let highlightEnd: number | null = null;
  if (params.highlight && params.highlight.includes(':')) {
    const [startStr, endStr] = params.highlight.split(':');
    highlightStart = Date.parse(startStr);
    highlightEnd = Date.parse(endStr);
  }

  for (const t of towerData) {
    const isGhost = t.isGhost;
    let strokeColor = '';
    let leftRightFillAttr = '';
    let topFillAttr = '';

    // Check if this specific tower falls inside our custom highlight range
    let isHighlighted = false;
    if (highlightStart !== null && highlightEnd !== null && t.date) {
      const currentTowerTime = Date.parse(t.date);
      if (currentTowerTime >= highlightStart && currentTowerTime <= highlightEnd) {
        isHighlighted = true;
      }
    }

    if (isAutoTheme) {
      strokeColor = isGhost ? 'var(--cp-text)' : 'var(--cp-accent)';
      leftRightFillAttr = isGhost ? 'class="cp-text-fill"' : 'class="cp-accent-fill"';
      topFillAttr = leftRightFillAttr;
    } else {
      const baseAccentColor = Array.isArray(accent)
        ? accent[accent.length - 1] || '00ffaa'
        : accent || '00ffaa';

      const accentColorHex = baseAccentColor.startsWith('#')
        ? baseAccentColor
        : `#${baseAccentColor}`;
      const textColorHex = text.startsWith('#') ? text : `#${text}`;

      let resolvedSolidColor = isGhost ? textColorHex : accentColorHex;
      if (!isGhost && t.intensityLevel > 0 && Array.isArray(accent)) {
        const quartileIdx = Math.min(t.intensityLevel - 1, accent.length - 1);
        const quartileColor = accent[quartileIdx] || accent[accent.length - 1] || '00ffaa';
        resolvedSolidColor = quartileColor.startsWith('#') ? quartileColor : `#${quartileColor}`;
      }

      // Visual Override: If within highlight range, overwrite with custom hex color
      if (isHighlighted && !isGhost) {
        resolvedSolidColor = '#ffaa00'; // Eye-catching golden highlight
      }

      strokeColor = resolvedSolidColor;
      leftRightFillAttr = `fill="${resolvedSolidColor}"`;
      topFillAttr = leftRightFillAttr;
    }

    let leftFaceOpacity = t.faceOpacity.left;
    let rightFaceOpacity = t.faceOpacity.right;
    let topFaceOpacity = t.faceOpacity.top;

    if (!isGhost && t.intensityLevel > 0 && params.shading === true) {
      const mult = opacityMultipliers[t.intensityLevel - 1];
      leftFaceOpacity = Math.round(leftFaceOpacity * mult * 100) / 100;
      rightFaceOpacity = Math.round(rightFaceOpacity * mult * 100) / 100;
      topFaceOpacity = Math.round(topFaceOpacity * mult * 100) / 100;
    }

    // Force highlight opacities to maximum to stand out
    if (isHighlighted && !isGhost) {
      leftFaceOpacity = 0.95;
      rightFaceOpacity = 0.8;
      topFaceOpacity = 1.0;
    }

    let leftFillAttr = leftRightFillAttr;
    let rightFillAttr = leftRightFillAttr;
    let finalTopFillAttr = topFillAttr;

    if (!isGhost && t.intensityLevel > 0 && params.gradient === true && !isHighlighted) {
      leftFillAttr = `fill="url(#tower-grad-level-${t.intensityLevel})"`;
      rightFillAttr = `fill="url(#tower-grad-level-${t.intensityLevel})"`;

      if (isAutoTheme) {
        finalTopFillAttr = 'class="cp-accent-fill"';
      } else {
        const capIdx = Math.min(t.intensityLevel - 1, accent.length - 1);
        const baseAccentColor = Array.isArray(accent)
          ? accent[capIdx] || accent[accent.length - 1]
          : accent;
        const capColor = baseAccentColor.startsWith('#') ? baseAccentColor : `#${baseAccentColor}`;
        finalTopFillAttr = `fill="${capColor}"`;
      }
    }

    const strokeAttr = isGhost
      ? `stroke="${strokeColor}" stroke-opacity="${t.strokeOpacity}" stroke-width="${t.strokeWidth}"`
      : '';

    let leftStrokeAttr = strokeAttr;
    let rightStrokeAttr = strokeAttr;
    let topStrokeAttr = strokeAttr;

    if (t.isToday && t.contributionCount === 0) {
      const todayStrokeColor = isAutoTheme ? 'var(--cp-accent)' : strokeColor;
      leftStrokeAttr = isGhost
        ? `stroke="${strokeColor}" stroke-opacity="${t.strokeOpacity}" stroke-width="${t.strokeWidth}"`
        : '';
      rightStrokeAttr = leftStrokeAttr;
      topStrokeAttr = `stroke="${todayStrokeColor}" stroke-opacity="0.8" stroke-width="${1.2 * sf}"`;
    }

    const delay = ((t.row + t.col) * 0.015).toFixed(3);

    const metric =
      t.contributionCount === 0 ? 'Rest day' : t.intensityLevel === 4 ? 'Peak day' : 'Active day';

    towers += `
        <g transform="translate(${t.x}, ${t.y})">
          <g class="cp-tower interactive-tower" data-date="${escapeXML(t.date)}" data-count="${t.contributionCount}" data-metric="${escapeXML(metric)}" style="animation-delay: ${delay}s;">
            ${t.isToday ? '<animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />' : ''}
            <title>${escapeXML(t.tooltip)}</title>
            <path d="M0 ${10 - t.h} L0 10 L-16 0 L-16 ${-t.h} Z" ${leftFillAttr} fill-opacity="${leftFaceOpacity}" ${leftStrokeAttr} />
            <path d="M0 ${10 - t.h} L0 10 L16 0 L16 ${-t.h} Z" ${rightFillAttr} fill-opacity="${rightFaceOpacity}" ${rightStrokeAttr} />
            <path d="M0 ${-t.h} L16 ${10 - t.h} L0 ${20 - t.h} L-16 ${10 - t.h} Z" ${finalTopFillAttr} fill-opacity="${topFaceOpacity}" ${topStrokeAttr} />
            ${t.contributionCount > 5 ? `<path d="M0 ${-t.h} L16 ${10 - t.h} L0 ${20 - t.h} L-16 ${10 - t.h} Z" fill="white" fill-opacity="0.2" />` : ''}
          </g>
        </g>`;

    if (t.contributionCount >= 10 && !params.disable_particles) {
      const pIdx = Math.min(t.intensityLevel - 1, accent.length - 1);
      const pColorResolved = Array.isArray(accent)
        ? accent[pIdx] || accent[accent.length - 1] || '00ffaa'
        : accent || '00ffaa';
      const pColor = isAutoTheme
        ? ''
        : pColorResolved.startsWith('#')
          ? pColorResolved
          : `#${pColorResolved}`;
      towers += generateParticles(t.x, t.y, t.h, t.contributionCount, sf, isAutoTheme, pColor);
    }
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
    y="${s(80)}"
    width="${s(400)}"
    height="${s(1)}"
    class="cp-accent-fill scan-line"
    fill-opacity="0.3"
    style="--scan-speed: ${params.speed || '8s'}; --scan-start: ${s(0)}px; --scan-end: ${s(240)}px;"
  />`;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Layout constants for 3D isometric grid positioning
const GRID_ORIGIN_X = 300;
const GRID_ORIGIN_Y = 120;
const TILE_WIDTH_HALF = 16;
const TILE_HEIGHT_HALF = 9;
const ISOMETRIC_VERTICAL_OFFSET = 20;

const MONTH_LABEL_ROW_OFFSET = 7.2;
const WEEKDAY_LABEL_COL_OFFSET = -1.2;

function renderIsometricLabels(
  calendar: ContributionCalendar,
  params: BadgeParams,
  color: string,
  sf: number
): string {
  if (!params.labels) return '';

  const s = createScaler(sf);
  let elements = '';

  const weeks = calendar.weeks.slice(-14);
  const monthLabels: { text: string; col: number }[] = [];
  let prevMonthStr = '';

  weeks.forEach((week, i) => {
    if (week.contributionDays.length === 0) return;
    const firstDay = week.contributionDays[0];
    const monthNum = parseInt(firstDay.date.substring(5, 7), 10);
    const monthStr = MONTH_NAMES[monthNum - 1];

    if (i === 0 || monthStr !== prevMonthStr) {
      monthLabels.push({ text: monthStr, col: i });
      prevMonthStr = monthStr;
    }
  });

  const labelColorHex = params.labelColor ? `#${params.labelColor}` : color;

  monthLabels.forEach((label) => {
    const tx = s(GRID_ORIGIN_X + (label.col - MONTH_LABEL_ROW_OFFSET) * TILE_WIDTH_HALF + 8);
    const ty =
      s(
        GRID_ORIGIN_Y +
          (label.col + MONTH_LABEL_ROW_OFFSET) * TILE_HEIGHT_HALF +
          ISOMETRIC_VERTICAL_OFFSET
      ) + Math.round(20 * sf);
    elements += `
    <text x="${tx}" y="${ty}" text-anchor="middle" fill="${labelColorHex}" class="isometric-label">${label.text}</text>`;
  });

  const weekdays = [
    { text: 'Mon', row: 1 },
    { text: 'Wed', row: 3 },
    { text: 'Fri', row: 5 },
  ];

  weekdays.forEach((day) => {
    const tx = s(GRID_ORIGIN_X + (WEEKDAY_LABEL_COL_OFFSET - day.row) * TILE_WIDTH_HALF);
    const ty =
      s(
        GRID_ORIGIN_Y +
          (WEEKDAY_LABEL_COL_OFFSET + day.row) * TILE_HEIGHT_HALF +
          ISOMETRIC_VERTICAL_OFFSET
      ) + Math.round(20 * sf);
    elements += `
    <text x="${tx}" y="${ty}" text-anchor="end" fill="${labelColorHex}" class="isometric-label">${day.text}</text>`;
  });

  return `<g class="isometric-labels">${elements}</g>`;
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

  const accent = Array.isArray(params.accent)
    ? params.accent.map((c) => sanitizeHexColor(c, '00ffaa'))
    : sanitizeHexColor(params.accent, '00ffaa');

  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;
  const borderAttr = params.border ? `stroke="#${params.border}" stroke-width="2"` : '';

  const sanitizedFont = sanitizeFont(params.font);
  const predefinedFont = sanitizedFont
    ? (FONT_MAP[sanitizedFont.toLowerCase() as keyof typeof FONT_MAP] ?? null)
    : null;
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
  const towers = renderTowers(towerData, params, accent, text, sf, false);

  const mainAccent = Array.isArray(accent)
    ? accent[accent.length - 1] || '00ffaa'
    : accent || '00ffaa';
  const mainAccentHex = mainAccent.startsWith('#') ? mainAccent : `#${mainAccent}`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${W} ${H}" fill="none" role="img">
  ${renderHeader(safeUser, stats, sf, params)}
  ${renderStyle(selectedFont, statsFont, googleFontsImport, text, mainAccentHex, sf, bg, params.entrance || 'rise')}
  <rect width="${W}" height="${H}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bg}" ${borderAttr} />
  <g transform="translate(0, ${Math.round(20 * sf)})">${towers}</g>
  ${renderIsometricLabels(calendar, params, text, sf)}
  ${renderFooter(stats, params, labels, safeUser, mainAccentHex, sf)}
</svg>`;
}

function generateAutoThemeSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  const light = AUTO_THEME_LIGHT;
  const dark = AUTO_THEME_DARK;
  const lightLabelFill = getLuminance(light.bg) > 0.5 ? 'var(--cp-text)' : 'var(--cp-accent)';
  const lightLabelOpacity = getLuminance(light.bg) > 0.5 ? '0.8' : '0.7';
  const darkLabelFill = getLuminance(dark.bg) > 0.5 ? 'var(--cp-text)' : 'var(--cp-accent)';
  const darkLabelOpacity = getLuminance(dark.bg) > 0.5 ? '0.8' : '0.7';
  const safeUser = escapeXML(params.user || 'GitHub User');
  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = sanitizedFont
    ? (FONT_MAP[sanitizedFont.toLowerCase() as keyof typeof FONT_MAP] ?? null) ||
      `"${sanitizedFont}", sans-serif`
    : null;
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const googleFontUrlPart = sanitizedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
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
  const towers = renderTowers(towerData, params, '', '', sf, true);

  const s = createScaler(sf);
  const fs = (n: number): number => Math.round(n * sf * 10) / 10;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${W} ${H}" fill="none" role="img">
  ${renderHeader(safeUser, stats, sf, params)}
  <style>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}
  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; --cp-label-fill: ${lightLabelFill}; --cp-label-opacity: ${lightLabelOpacity}; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; --cp-label-fill: ${darkLabelFill}; --cp-label-opacity: ${darkLabelOpacity}; } }
  .cp-bg-fill { fill: var(--cp-bg); } .cp-text-fill { fill: var(--cp-text); color: var(--cp-text); } .cp-accent-fill { fill: var(--cp-accent); color: var(--cp-accent); }
  ${getTowerAnimationCSS(params.entrance || 'rise')}
  .scan-line {
    animation: scan-sweep var(--scan-speed, 8s) linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  @keyframes scan-sweep {
    from { transform: translateY(var(--scan-start, ${s(0)}px)); }
    to { transform: translateY(var(--scan-end, ${s(240)}px)); }
  }
  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: var(--cp-text); font-size: ${fs(18)}px; letter-spacing: ${fs(6)}px; font-weight: 400; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: var(--cp-text); font-size: ${fs(42)}px; font-weight: 500; letter-spacing: 0; }
  .total-val { font-family: ${statsFont}; fill: var(--cp-accent); font-size: ${fs(24)}px; font-weight: 500; }
  .label { font-family: "Roboto", sans-serif; fill: var(--cp-label-fill); font-size: ${fs(11)}px; font-weight: 400; letter-spacing: ${fs(2)}px; opacity: var(--cp-label-opacity); }
  .isometric-label { font-family: ${selectedFont || '"Roboto", sans-serif'}; font-size: ${fs(10)}px; font-weight: 400; letter-spacing: 1px; fill-opacity: 0.6; }
  ${getInteractiveTowerCSS('var(--cp-accent)')}
  @media (prefers-reduced-motion: reduce) {
    .heat-particles { display: none; }
    .scan-line {
      animation: none !important;
      transition: none !important;
      transform: translateY(var(--scan-start, ${s(0)}px)) !important;
    }
  }
  </style>
  <rect width="${W}" height="${H}" rx="${radius}" ${params.hideBackground ? 'fill="transparent"' : 'class="cp-bg-fill"'} />
  <g transform="translate(0, ${s(20)})">${towers}</g>
  ${renderIsometricLabels(calendar, params, 'var(--cp-text)', sf)}
  ${!params.hide_stats ? renderStatsSection(stats, labels, s, params) : ''}
  ${!params.hide_title ? `<text x="${s(300)}" y="${s(50)}" text-anchor="middle" class="title">${truncateUsername(safeUser).toUpperCase()}</text>` : ''}
  <rect
    x="${s(100)}"
    y="${s(80)}"
    width="${s(400)}"
    height="${s(1)}"
    class="cp-accent-fill scan-line"
    fill-opacity="0.3"
    style="--scan-speed: ${params.speed || '8s'}; --scan-start: ${s(0)}px; --scan-end: ${s(240)}px;"
  />
</svg>
`;
}

export function generateMonthlySVG(stats: MonthlyStats, params: BadgeParams): string {
  if (params.autoTheme) return generateAutoThemeMonthlySVG(stats, params);

  const safeUser = escapeXML(params.user || 'GitHub User');
  const bg = `#${sanitizeHexColor(params.bg, '0d1117')}`;
  const rawAccent = Array.isArray(params.accent) ? params.accent[params.accent.length - 1] : params.accent;
  const accent = `#${sanitizeHexColor(rawAccent, '00ffaa')}`;
  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;

  const sanitizedFont = sanitizeFont(params.font);
  const predefinedFont = sanitizedFont ? (FONT_MAP[sanitizedFont.toLowerCase() as keyof typeof FONT_MAP] ?? null) : null;
  const selectedFont = predefinedFont ? predefinedFont : sanitizedFont ? `"${sanitizedFont}", sans-serif` : null;

  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const radius = sanitizeRadius(params.radius, 8);
  const labels = getLabels(params.lang);
  const width = params.width || 300;
  const height = params.height || 120;

  const googleFontUrlPart = sanitizedFont && !predefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');` : '';

  const commitsLabel = params.mode === 'loc' ? 'LINES THIS MONTH' : labels.COMMITS_THIS_MONTH;
  const deltaUnit = params.mode === 'loc' ? 'lines' : 'commits';

  let deltaText = '';
  if (params.delta_format === 'absolute') {
    deltaText = stats.deltaAbsolute > 0 ? `+${stats.deltaAbsolute} ${deltaUnit}` : `${stats.deltaAbsolute} ${deltaUnit}`;
  } else if (params.delta_format === 'both') {
    deltaText = stats.deltaPercentage === null ? `N/A (${stats.deltaAbsolute})` : `${stats.deltaPercentage > 0 ? '+' : ''}${stats.deltaPercentage}% (${stats.deltaAbsolute > 0 ? '+' : ''}${stats.deltaAbsolute})`;
  } else {
    deltaText = stats.deltaPercentage === null ? 'N/A' : `${stats.deltaPercentage > 0 ? '+' : ''}${stats.deltaPercentage}%`;
  }

  let negativeColor = '#ff4444';
  const cleanBg = sanitizeHexColor(params.bg, '0d1117');
  const matchedTheme = Object.values(themes).find((t) => t.bg.toLowerCase() === cleanBg.toLowerCase());
  if (matchedTheme && matchedTheme.negative) {
    negativeColor = `#${matchedTheme.negative}`;
  } else {
    negativeColor = getLuminance(cleanBg) > 0.5 ? '#cf222e' : '#f85149';
  }

  const deltaColor = stats.deltaAbsolute >= 0 ? accent : negativeColor;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img">
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
</svg>`;
}

function generateAutoThemeMonthlySVG(stats: MonthlyStats, params: BadgeParams): string {
  const light = AUTO_THEME_LIGHT;
  const dark = AUTO_THEME_DARK;
  const safeUser = escapeXML(params.user || 'GitHub User');
  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = sanitizedFont ? (FONT_MAP[sanitizedFont.toLowerCase() as keyof typeof FONT_MAP] ?? null) || `"${sanitizedFont}", sans-serif` : null;
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const radius = sanitizeRadius(params.radius, 8);
  const labels = getLabels(params.lang);
  const width = params.width || 300;
  const height = params.height || 120;

  const commitsLabel = params.mode === 'loc' ? 'LINES THIS MONTH' : labels.COMMITS_THIS_MONTH;
  const deltaUnit = params.mode === 'loc' ? 'lines' : 'commits';

  let deltaText = '';
  if (params.delta_format === 'absolute') {
    deltaText = stats.deltaAbsolute > 0 ? `+${stats.deltaAbsolute} ${deltaUnit}` : `${stats.deltaAbsolute} ${deltaUnit}`;
  } else {
    deltaText = stats.deltaPercentage === null ? 'N/A' : `${stats.deltaPercentage > 0 ? '+' : ''}${stats.deltaPercentage}%`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img">
  <style>
  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; --cp-delta: ${stats.deltaAbsolute >= 0 ? `#${light.accent}` : '#cf222e'}; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; --cp-delta: ${stats.deltaAbsolute >= 0 ? `#${dark.accent}` : '#f85149'}; } }
  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: var(--cp-text); font-size: 14px; letter-spacing: 2px; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: var(--cp-accent); font-size: 36px; font-weight: 600; }
  .label { font-family: "Roboto", sans-serif; fill: var(--cp-text); font-size: 10px; opacity: 0.7; }
  .delta { font-family: "Roboto", sans-serif; fill: var(--cp-delta); font-size: 12px; font-weight: 500; }
  </style>
  <rect width="${width}" height="${height}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : 'var(--cp-bg)'}" />
  <text x="20" y="40" class="title">${stats.currentMonthName.toUpperCase()}</text>
  <text x="20" y="85" class="stats">${stats.currentMonthTotal}</text>
  <text x="20" y="105" class="label">${commitsLabel}</text>
  <g transform="translate(${width - 20}, 80)" text-anchor="end">
    <text class="delta">${deltaText}</text>
    <text y="20" class="label">${labels.VS_LAST_MONTH}</text>
  </g>
</svg>`;
}

export function generateWrappedSVG(stats: any, params: any, calendar: any) {
    const { highlight } = params;
    let highlightStart: number | null = null;
    let highlightEnd: number | null = null;

    if (highlight && highlight.includes(':')) {
        const [startStr, endStr] = highlight.split(':');
        highlightStart = new Date(startStr).getTime();
        highlightEnd = new Date(endStr).getTime();
    }

    // Safeguard the views so neither default nor heatmap throws a 500 error
    const accent = params.accent || '#22c55e';
    const text = params.text || '#ffffff';
    const sf = params.sf || 1;

    // If it's a heatmap view, inject the tracking directly into the grid renderer
    if (params.view === 'heatmap') {
        // Fallback safely if renderHeatmapGrid takes specific arguments
        try {
            return renderHeatmapGrid(calendar, accent, text, sf, stats.todayDate, params.mode, false, { highlightStart, highlightEnd });
        } catch (e) {
            return renderHeatmapGrid(calendar, accent, text, sf, stats.todayDate, params.mode, false);
        }
    }

    // Default 3D Isometric View handling
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${params.width || 800}" height="${params.height || 400}" viewBox="0 0 ${params.width || 800} ${params.height || 400}">
        <style>
            .title { font-family: ${params.selectedFont || "Syncopate"}, sans-serif; fill: ${text}; font-size: 16px; }
            .stat-val { font-family: ${params.statsFont || "Roboto"}, sans-serif; fill: ${accent}; font-size: 22px; font-weight: 700; }
            .label { font-family: "Roboto", sans-serif; fill: ${text}; font-size: 11px; opacity: 0.6; letter-spacing: 1px; }
        </style>
        <rect width="100%" height="100%" rx="${params.radius || 0}" fill="${params.hideBackground ? 'transparent' : '#0d1117'}" />
        <text x="25" y="45" class="title">${stats.year || 2026} WRAPPED</text>
        <text x="25" y="90" class="stat-val">${stats.totalContributions}</text>
        <text x="25" y="110" class="label">TOTAL CONTRIBUTIONS</text>
        <text x="240" y="90" class="stat-val">${stats.longestStreak} DAYS</text>
        <text x="240" y="110" class="label">LONGEST STREAK</text>
    </svg>
    `;
}