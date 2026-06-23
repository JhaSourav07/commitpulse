// lib/svg/generator.ts

import type {
  BadgeParams,
  ContributionCalendar,
  StreakStats,
  MonthlyStats,
  RepoContribution,
} from '../../types';
import { getLabels, type BadgeLabels } from '../i18n/badgeLabels';
import { AUTO_THEME_DARK, AUTO_THEME_LIGHT, themes } from './themes';
import { getTowerAnimationCSS } from './animations';
import { computeTowers, type TowerData } from './layout';
import { LANGUAGE_COLORS } from './languageColors';
import {
  sanitizeFont,
  sanitizeHexColor,
  sanitizeRadius,
  sanitizeGoogleFontUrl,
  getLuminance,
  parseGradientStops,
  getGradientCoordinates,
  escapeXML,
  sanitizeSpeed,
  sanitizeCustomText,
} from './sanitizer';

import { GRID_ORIGIN_X, GRID_ORIGIN_Y, TILE_HEIGHT_HALF, TILE_WIDTH_HALF } from './layoutConstants';

import { SVG_WIDTH, SVG_HEIGHT, MAX_USERNAME_DISPLAY_LENGTH } from './generatorConstants';

const FONT_MAP = {
  jetbrains: '"JetBrains Mono", monospace',
  fira: '"Fira Code", monospace',
  roboto: '"Roboto", sans-serif',
  syncopate: '"Syncopate", sans-serif',
  spacegrotesk: '"Space Grotesk", sans-serif',
  'space grotesk': '"Space Grotesk", sans-serif',
  firacode: '"Fira Code", monospace',
  'jetbrains mono': '"JetBrains Mono", monospace',
  inter: '"Inter", sans-serif',
  space: '"Space Grotesk", sans-serif',
} as const;

export function resolveFont(sanitizedFont?: string | null): string | null {
  if (!sanitizedFont) return null;

  return (
    FONT_MAP[sanitizedFont.toLowerCase() as keyof typeof FONT_MAP] ??
    `"${sanitizedFont}", sans-serif`
  );
}

function isBundledFont(sanitizedFont?: string | null): boolean {
  if (!sanitizedFont) return false;

  const fontKey = sanitizedFont.toLowerCase() as keyof typeof FONT_MAP;
  return fontKey in FONT_MAP && fontKey !== 'inter';
}

export function getSizeScale(size?: 'small' | 'medium' | 'large') {
  if (size === 'small') return 400 / SVG_WIDTH;
  if (size === 'large') return 800 / SVG_WIDTH;
  return 1;
}

export function truncateUsername(username: string): string {
  return username.length > MAX_USERNAME_DISPLAY_LENGTH
    ? `${username.slice(0, MAX_USERNAME_DISPLAY_LENGTH)}...`
    : username;
}

export function getUsernameFontSize(username: string): number {
  const len = username.length;
  if (len <= 12) return 18;
  return Math.max(10, 18 - (len - 12) * 0.5);
}

export function deterministicRandom(seed?: string | null): number {
  const safeSeed = seed || '';
  let h1 = 0xdeadbeef;
  for (let i = 0; i < safeSeed.length; i++) {
    let k = safeSeed.charCodeAt(i) & 0xff;
    k = Math.imul(k, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);
    h1 ^= k;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }
  h1 ^= safeSeed.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;
  return (h1 >>> 0) / 4294967296;
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

export function particleCount(count?: number | null): number {
  if (typeof count !== 'number' || count <= 0 || Number.isNaN(count)) return 0;
  return Math.min(5, Math.max(3, Math.floor(count / 4)));
}

export interface TowerPaths {
  left: string;
  right: string;
  top: string;
}

export function buildTowerPaths(h: number, scale: number = 1): TowerPaths {
  const tileHalfWidth = 16 * scale;
  const tileHalfHeight = 10 * scale;
  const tileFullHeight = 20 * scale;

  return {
    left: `M0 ${tileHalfHeight - h} L0 ${tileHalfHeight} L-${tileHalfWidth} 0 L-${tileHalfWidth} ${-h} Z`,
    right: `M0 ${tileHalfHeight - h} L0 ${tileHalfHeight} L${tileHalfWidth} 0 L${tileHalfWidth} ${-h} Z`,
    top: `M0 ${-h} L${tileHalfWidth} ${tileHalfHeight - h} L0 ${tileFullHeight - h} L-${tileHalfWidth} ${tileHalfHeight - h} Z`,
  };
}

function generateParticles(
  x: number,
  y: number,
  height: number,
  count: number,
  sf: number,
  autoTheme: boolean = false,
  color: string = '',
  animate: boolean = true
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
       ${
         animate
           ? `
         <animate attributeName="cy" from="${y - height}" to="${y - height - Math.round(20 * sf)}" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
         <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
       `
           : ''
       }
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

function renderHeader(
  safeUser: string,
  stats: StreakStats,
  sf: number,
  params: BadgeParams,
  safeId: string
): string {
  const unit = params.mode === 'loc' ? 'est. lines of code' : 'total contributions';
  const entity = params.org ? 'Organization' : params.repo ? 'Repository' : 'User';

  return `
  <title id="cp-title-${safeId}">CommitPulse ${entity} Stats for ${safeUser}</title>
  <desc id="cp-desc-${safeId}">
    ${safeUser} has ${stats.totalContributions} ${unit} and a longest streak of ${stats.longestStreak} days.
  </desc>
  ${renderDefs(sf, params)}`;
}

function generateCustomGradients(params: BadgeParams): { gradients: string; gradientId: string } {
  const stops = parseGradientStops(params.gradient_stops);

  if (stops.length < 2) {
    return { gradients: '', gradientId: '' };
  }

  const coords = getGradientCoordinates(params.gradient_dir);
  const gradientSignature = `${stops.join('-')}-${params.gradient_dir || 'vertical'}`;
  const gradientId = `custom-grad-${deterministicRandom(gradientSignature)
    .toString()
    .slice(2, 10)}`;

  let gradients = '';

  for (let i = 0; i < 4; i++) {
    const level = i + 1;
    const levelId = `${gradientId}-level-${level}`;

    let stopElements = '';
    const stopCount = stops.length;

    stops.forEach((color, stopIdx) => {
      const offset = (stopIdx / (stopCount - 1)) * 100;
      const baseOpacity = 0.4 + i * 0.2;
      const stopOpacity = Math.min(1, baseOpacity + stopIdx * 0.1);

      const colorHex = color.startsWith('#') ? color : `#${color}`;
      stopElements += `
         <stop offset="${offset}%" stop-color="${colorHex}" stop-opacity="${stopOpacity}" />`;
    });

    gradients += `
       <linearGradient id="${levelId}" x1="${coords.x1}" y1="${coords.y1}" x2="${coords.x2}" y2="${coords.y2}">
${stopElements}
       </linearGradient>`;
  }

  params.__customGradientId = gradientId;
  return { gradients, gradientId };
}

function renderDefs(sf: number, params: BadgeParams): string {
  const fs = (n: number): number => Math.round(n * sf * 10) / 10;

  let gradients = '';
  if (params.gradient) {
    const result = generateCustomGradients(params);
    if (result.gradientId) {
      gradients = result.gradients;
    } else {
      const bgStr = params.bg || '0d1117';
      const bgHex = bgStr.startsWith('#') ? bgStr : `#${bgStr}`;

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
          : [0, 1, 2, 3].map(() =>
              String(accent).startsWith('#') ? String(accent) : `#${accent}`
            );

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
  }

  const filterGlow =
    params.glow !== false
      ? `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${fs(
          5
        )}" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>`
      : '';

  let canvasGradient = '';
  if (params.bgType === 'linear' || params.bgType === 'radial') {
    const bgStart = params.bgStart
      ? params.bgStart.startsWith('#')
        ? params.bgStart
        : `#${params.bgStart}`
      : '#0d1117';
    const bgEnd = params.bgEnd
      ? params.bgEnd.startsWith('#')
        ? params.bgEnd
        : `#${params.bgEnd}`
      : '#000000';
    if (params.bgType === 'linear') {
      const angle = params.bgAngle !== undefined ? params.bgAngle : 90;
      const angleRad = (angle - 90) * (Math.PI / 180);
      const x1 = Math.round(50 + Math.cos(angleRad + Math.PI) * 50) + '%';
      const y1 = Math.round(50 + Math.sin(angleRad + Math.PI) * 50) + '%';
      const x2 = Math.round(50 + Math.cos(angleRad) * 50) + '%';
      const y2 = Math.round(50 + Math.sin(angleRad) * 50) + '%';
      canvasGradient = `
       <linearGradient id="canvas-gradient" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
         <stop offset="0%" stop-color="${bgStart}" />
         <stop offset="100%" stop-color="${bgEnd}" />
       </linearGradient>`;
    } else {
      canvasGradient = `
       <radialGradient id="canvas-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
         <stop offset="0%" stop-color="${bgStart}" />
         <stop offset="100%" stop-color="${bgEnd}" />
       </radialGradient>`;
    }
  }

  return `<defs>
     ${filterGlow}
     ${gradients}
     ${canvasGradient}
   </defs>`;
}

function renderStatsSection(
  stats: StreakStats,
  labels: BadgeLabels,
  s: Scaler,
  params: BadgeParams,
  yOffset = 0
): string {
  const totalLabel =
    params.mode === 'loc' ? 'TOTAL LINES OF CODE (EST.)' : labels.ANNUAL_SYNC_TOTAL;
  const glowAttr = params.glow !== false ? ' filter="url(#glow)"' : '';

  return `
  <g transform="translate(${s(100)}, ${s(340 + yOffset)})" text-anchor="middle">
    <text class="label">${labels.CURRENT_STREAK}</text>
    <text y="${s(40)}" class="stats"${glowAttr}>${stats.currentStreak}</text>
  </g>

  <g transform="translate(${s(300)}, ${s(340 + yOffset)})" text-anchor="middle">
    <text class="label">${totalLabel}</text>
    <text y="${s(40)}" class="total-val"${glowAttr}>${stats.totalContributions}</text>
  </g>

  <g transform="translate(${s(500)}, ${s(340 + yOffset)})" text-anchor="middle">
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
  entrance: 'rise' | 'fade' | 'slide' | 'wave' | 'bounce' | 'none' = 'rise'
): string {
  const fs = (n: number) => Math.round(n * sf * 10) / 10;
  const isLightBg = getLuminance(bg) > 0.5;
  const labelFill = isLightBg ? text : accent;
  const labelOpacity = isLightBg ? 0.8 : 0.7;

  return `
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}
  ${getTowerAnimationCSS(entrance, sf)}
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
  .subtitle { font-family: "Roboto", sans-serif; fill: ${labelFill}; font-size: ${fs(10)}px; letter-spacing: ${fs(2)}px; font-weight: 400; opacity: ${labelOpacity - 0.1}; }
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
    .cp-tower animate { display: none; }
    .interactive-tower { transition: none !important; }
  }
  .isometric-label { font-family: ${selectedFont || '"Roboto", sans-serif'}; font-size: ${fs(10)}px; font-weight: 400; letter-spacing: 1px; fill-opacity: 0.6; }
  .dimmed-tower { opacity: 0.3; }
  ${getInteractiveTowerCSS(`${accent}66`)}
  </style>`;
}

function renderTowers(
  towerData: TowerData[],
  params: BadgeParams,
  accent: string | string[],
  text: string,
  sf: number,
  isAutoTheme: boolean = false,
  opacity: number = 1.0,
  animate: boolean = true
): string {
  let towers = '';
  const opacityMultipliers = [0.4, 0.6, 0.8, 1.0];

  const theta = params.theta !== undefined ? params.theta : 45;
  const phi = params.phi !== undefined ? params.phi : Math.asin(10 / 16) * (180 / Math.PI);

  const thetaRad = (theta * Math.PI) / 180;
  const phiRad = (phi * Math.PI) / 180;

  const d = 8 * Math.sqrt(2);
  const cosTheta = Math.cos(thetaRad);
  const sinTheta = Math.sin(thetaRad);
  const sinPhi = Math.sin(phiRad);

  // Base tile corners relative to the center of the base (unscaled)
  const ax = cosTheta * -d - sinTheta * -d;
  const ay = sinTheta * sinPhi * -d + cosTheta * sinPhi * -d;
  const bx = cosTheta * d - sinTheta * -d;
  const by = sinTheta * sinPhi * d + cosTheta * sinPhi * -d;
  const cx = cosTheta * d - sinTheta * d;
  const cy = sinTheta * sinPhi * d + cosTheta * sinPhi * d;
  const dx = cosTheta * -d - sinTheta * d;
  const dy = sinTheta * sinPhi * -d + cosTheta * sinPhi * d;

  const rnd = (num: number) => {
    const val = Math.round(num * 10000) / 10000;
    return val === 0 ? 0 : val;
  };

  // Scale the local offsets by sf and round to eliminate float noise
  const ax_sf = rnd(ax * sf);
  const ay_sf = rnd(ay * sf);
  const bx_sf = rnd(bx * sf);
  const by_sf = rnd(by * sf);
  const cx_sf = rnd(cx * sf);
  const cy_sf = rnd(cy * sf);
  const dx_sf = rnd(dx * sf);
  const dy_sf = rnd(dy * sf);

  const sortedTowers = [...towerData].sort((a, b) => a.row + a.col - (b.row + b.col));

  for (const t of sortedTowers) {
    const isGhost = t.isGhost;
    let strokeColor = '';
    let leftRightFillAttr = '';
    let topFillAttr = '';

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

      strokeColor = resolvedSolidColor;
      leftRightFillAttr = `fill="${resolvedSolidColor}"`;
      topFillAttr = leftRightFillAttr;
    }

    let leftFaceOpacity = Math.round(t.faceOpacity.left * opacity * 100) / 100;
    let rightFaceOpacity = Math.round(t.faceOpacity.right * opacity * 100) / 100;
    let topFaceOpacity = Math.round(t.faceOpacity.top * opacity * 100) / 100;

    if (!isGhost && t.intensityLevel > 0 && params.shading === true) {
      const mult = opacityMultipliers[t.intensityLevel - 1];
      leftFaceOpacity = Math.round(leftFaceOpacity * mult * 100) / 100;
      rightFaceOpacity = Math.round(rightFaceOpacity * mult * 100) / 100;
      topFaceOpacity = Math.round(topFaceOpacity * mult * 100) / 100;
    }

    let leftFillAttr = leftRightFillAttr;
    let rightFillAttr = leftRightFillAttr;
    let finalTopFillAttr = topFillAttr;

    if (!isGhost && t.intensityLevel > 0 && params.gradient === true) {
      const customGradId = params.__customGradientId;
      const gradId = customGradId
        ? `${customGradId}-level-${t.intensityLevel}`
        : `tower-grad-level-${t.intensityLevel}`;

      leftFillAttr = `fill="url(#${gradId})"`;
      rightFillAttr = `fill="url(#${gradId})"`;

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

    const isWeekend = t.col === 0 || t.col === 6;
    const shouldDim = params.dim_weekends && isWeekend;
    const dimAttr = shouldDim ? ' class="dimmed-tower" style="opacity: 0.3;"' : '';

    // Calculate dynamic 3D coordinates based on row, col, theta, phi
    const gridX = t.row * 16 * Math.sqrt(2);
    const gridY = t.col * 16 * Math.sqrt(2);

    const x_base = cosTheta * gridX - sinTheta * gridY;
    const y_base = sinTheta * sinPhi * gridX + cosTheta * sinPhi * gridY;

    // Apply scaling factor (sf) and add origin offsets
    const towerX = Math.round((GRID_ORIGIN_X + x_base) * sf);
    const towerY = Math.round((GRID_ORIGIN_Y + y_base) * sf);

    const hOffset = t.h;

    const paths = {
      left: `M${cx_sf} ${rnd(cy_sf - hOffset)} L${cx_sf} ${cy_sf} L${dx_sf} ${dy_sf} L${dx_sf} ${rnd(dy_sf - hOffset)} Z`,
      right: `M${cx_sf} ${rnd(cy_sf - hOffset)} L${cx_sf} ${cy_sf} L${bx_sf} ${by_sf} L${bx_sf} ${rnd(by_sf - hOffset)} Z`,
      top: `M${ax_sf} ${rnd(ay_sf - hOffset)} L${bx_sf} ${rnd(by_sf - hOffset)} L${cx_sf} ${rnd(cy_sf - hOffset)} L${dx_sf} ${rnd(dy_sf - hOffset)} Z`,
    };

    towers += `
        <g transform="translate(${towerX}, ${towerY})"${dimAttr}>
          <g class="cp-tower interactive-tower" data-date="${escapeXML(t.date)}" data-count="${t.contributionCount}" data-metric="${escapeXML(metric)}" style="animation-delay: ${delay}s;">
            ${animate && t.isToday ? '<animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />' : ''}
            <title>${escapeXML(t.tooltip)}</title>
            <path d="${paths.left}" ${leftFillAttr} fill-opacity="${leftFaceOpacity}" ${leftStrokeAttr} />
            <path d="${paths.right}" ${rightFillAttr} fill-opacity="${rightFaceOpacity}" ${rightStrokeAttr} />
            <path d="${paths.top}" ${finalTopFillAttr} fill-opacity="${topFaceOpacity}" ${topStrokeAttr} />
            ${t.contributionCount > 5 ? `<path d="${paths.top}" fill="white" fill-opacity="0.2" />` : ''}
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
      let particlesMarkup = generateParticles(
        towerX,
        towerY,
        hOffset,
        t.contributionCount,
        sf,
        isAutoTheme,
        pColor,
        animate
      );
      if (shouldDim) {
        particlesMarkup = `<g class="dimmed-tower" style="opacity: 0.3;">${particlesMarkup}</g>`;
      }
      towers += particlesMarkup;
    }
  }
  return towers;
}

function renderRadarScan(
  speed: string,
  sf: number,
  accentColor: string,
  autoTheme: boolean
): string {
  const safeSpeed = sanitizeSpeed(speed);
  const s = createScaler(sf);
  const fillAttr = autoTheme
    ? 'class="cp-accent-fill scan-line"'
    : `fill="${accentColor}" class="cp-accent-fill scan-line"`;
  return `<rect
    x="${s(100)}"
    y="${s(80)}"
    width="${s(400)}"
    height="${s(1)}"
    ${fillAttr}
    fill-opacity="0.3"
    style="--scan-speed: ${safeSpeed}; --scan-start: ${s(0)}px; --scan-end: ${s(240)}px;"
  />`;
}

function renderFooter(
  stats: StreakStats,
  params: BadgeParams,
  labels: ReturnType<typeof getLabels>,
  safeUser: string,
  accent: string,
  sf: number,
  isWinner?: boolean
): string {
  const s = createScaler(sf);
  const fs = (n: number): number => Math.round(n * sf * 10) / 10;
  const statsOffset = params.label === false ? -40 : 0;

  // Static themes do not define the .cp-accent-fill CSS rule, so the scan line needs an
  // explicit fill or it inherits the SVG default fill="none" and becomes invisible.
  const scanLineFill = params.autoTheme
    ? 'class="cp-accent-fill scan-line"'
    : `fill="${accent}" class="cp-accent-fill scan-line"`;

  const displayTitle = params.custom_title
    ? sanitizeCustomText(params.custom_title)
    : `${truncateUsername(safeUser).toUpperCase()}${isWinner ? ' 👑' : ''}`;

  const titleText = `${displayTitle}${
    params.isOfflineFallback
      ? '<tspan fill="#ff9f43" font-size="10px" font-weight="bold"> [STALE CACHE]</tspan>'
      : ''
  }`;

  const titleFontSize = getUsernameFontSize(params.custom_title || truncateUsername(safeUser));

  let subtitleElement = '';
  if (params.custom_subtitle && !params.hide_title && params.label !== false) {
    const safeSubtitle = sanitizeCustomText(params.custom_subtitle);
    subtitleElement = `\n  <text x="${s(300)}" y="${s(68)}" text-anchor="middle" class="subtitle">${safeSubtitle}</text>`;
  }

  return `
  ${!params.hide_stats ? renderStatsSection(stats, labels, s, params, statsOffset) : ''}

  ${
    !params.hide_title && params.label !== false
      ? `<text x="${s(300)}" y="${s(50)}" text-anchor="middle" class="title" font-size="${fs(titleFontSize)}" style="font-size: ${fs(titleFontSize)}px;">${titleText}</text>`
      : ''
  }
  ${subtitleElement}
  <rect
    x="${s(100)}"
    y="${s(80 + statsOffset)}"
    width="${s(400)}"
    height="${s(1)}"
    ${scanLineFill}
    fill-opacity="0.3"
    style="--scan-speed: ${sanitizeSpeed(params.speed)}; --scan-start: ${s(0)}px; --scan-end: ${s(240)}px;"
  />`;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

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
  let labelColorHex = color;
  if (params.labelColor) {
    const fallbackHex = color.replace(/^#/, '') || 'ffffff';
    labelColorHex = `#${sanitizeHexColor(params.labelColor, fallbackHex)}`;
  }

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

function renderMilestoneBadges(stats: StreakStats, params: BadgeParams, sf: number): string {
  if (!params.badges) return '';

  const badges = [];
  if (stats.longestStreak >= 365) badges.push({ text: '🔥 Unstoppable', color: '#FFD700' });
  else if (stats.longestStreak >= 100) badges.push({ text: '💯 Century Club', color: '#C0C0C0' });

  if (stats.totalContributions >= 5000) badges.push({ text: '🌟 Elite', color: '#b9f2ff' });
  else if (stats.totalContributions >= 1000) badges.push({ text: '🚀 1K Club', color: '#cd7f32' });
  else if (stats.totalContributions >= 500)
    badges.push({ text: '⭐ 500+ Commits', color: '#cd7f32' });

  if (badges.length === 0) return '';

  const fs = (n: number) => Math.round(n * sf * 10) / 10;
  const s = createScaler(sf);

  let elements = '';
  const badgeWidth = 110;
  const spacing = 10;
  const totalWidth = badges.length * badgeWidth + (badges.length - 1) * spacing;
  const startX = 300 - totalWidth / 2 + badgeWidth / 2;

  badges.forEach((b, i) => {
    const cx = s(startX + i * (badgeWidth + spacing));
    const cy = s(400);
    const glowAttr = params.glow !== false ? ' filter="url(#glow)"' : '';

    elements += `
      <g transform="translate(${cx}, ${cy})" class="badge-group">
        <rect x="${s(-badgeWidth / 2)}" y="${s(-12)}" width="${s(badgeWidth)}" height="${s(24)}" rx="${s(12)}" fill="${b.color}" fill-opacity="0.1" stroke="${b.color}" stroke-opacity="0.5" stroke-width="1" />
        <text y="${s(4)}" text-anchor="middle" font-family='"Roboto", sans-serif' font-size="${fs(11)}px" font-weight="bold" fill="${b.color}" ${glowAttr}>${b.text}</text>
      </g>
    `;
  });

  return `<g class="milestone-badges">${elements}</g>`;
}

export function generateSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  if (params.autoTheme) return generateAutoThemeSVG(stats, params, calendar);
  if (params.compact) return generateCompactSVG(stats, params);

  const animate = params.animate ?? true;
  const safeUser = escapeXML(params.user || 'GitHub User');
  const bg = `#${sanitizeHexColor(params.bg, '0d1117')}`;
  const bgFill =
    params.bgType === 'linear' || params.bgType === 'radial' ? 'url(#canvas-gradient)' : bg;

  const accent = Array.isArray(params.accent)
    ? params.accent.map((c) => sanitizeHexColor(c, '00ffaa'))
    : sanitizeHexColor(params.accent, '00ffaa');

  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;

  const borderAttr = params.border
    ? `stroke="#${sanitizeHexColor(params.border, '000000')}" stroke-width="2"`
    : '';

  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const isPredefinedFont = isBundledFont(sanitizedFont);
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const googleFontUrlPart =
    sanitizedFont && !isPredefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;

  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const sf = getSizeScale(params.size);
  const radius = sanitizeRadius(params.radius, 8) * sf;
  const labels = getLabels(params.lang);
  const labelVisible = params.label !== false;
  const W = Math.round(SVG_WIDTH * sf);
  const H = Math.round((labelVisible ? SVG_HEIGHT : SVG_HEIGHT - 40) * sf);
  const yOffset = params.label === false ? -40 : 0;
  const towerData = scaleTowerData(
    computeTowers(calendar, params.scale, stats.todayDate, params.mode),
    sf
  );
  if (params.gradient) {
    generateCustomGradients(params);
  }
  const towers = renderTowers(
    towerData,
    params,
    accent,
    text,
    sf,
    false,
    params.opacity ?? 1.0,
    animate
  );

  const mainAccent = Array.isArray(accent)
    ? accent[accent.length - 1] || '00ffaa'
    : accent || '00ffaa';
  const mainAccentHex = mainAccent.startsWith('#') ? mainAccent : `#${mainAccent}`;

  const safeId = safeUser.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-labelledby="cp-title-${safeId}" aria-describedby="cp-desc-${safeId}">
  ${renderHeader(safeUser, stats, sf, params, safeId)}
  ${renderStyle(selectedFont, statsFont, googleFontsImport, text, mainAccentHex, sf, bg, params.entrance || 'rise')}
  <rect width="${W}" height="${H}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bgFill}" ${borderAttr} />
  <g id="cp-towers" style="transform-origin: center; transform-box: fill-box;" transform="translate(0, ${Math.round((20 + yOffset) * sf)})">${towers}</g>
  ${renderIsometricLabels(calendar, params, text, sf)}
  ${renderFooter(stats, params, labels, safeUser, mainAccentHex, sf)}
  ${renderMilestoneBadges(stats, params, sf)}
</svg>`;
}

function generateCompactSVG(stats: StreakStats, params: BadgeParams): string {
  const safeUser = escapeXML(params.user || 'GitHub User');
  const bg = `#${sanitizeHexColor(params.bg, '0d1117')}`;
  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;

  const accentRaw = Array.isArray(params.accent)
    ? params.accent[params.accent.length - 1]
    : params.accent;
  const accent = `#${sanitizeHexColor(accentRaw, '00ffaa')}`;

  const borderAttr = params.border ? `stroke="#${params.border}" stroke-width="2"` : '';
  const radius = sanitizeRadius(params.radius, 12);

  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const isPredefinedFont = isBundledFont(sanitizedFont);
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const googleFontUrlPart =
    sanitizedFont && !isPredefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const width = 280;
  const height = 100;
  const safeId = safeUser.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();
  const titleText = `${truncateUsername(safeUser)}${
    params.isOfflineFallback ? ' [STALE CACHE]' : ''
  }`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img" aria-labelledby="cp-title-${safeId}" aria-describedby="cp-desc-${safeId}">
  <title id="cp-title-${safeId}">CommitPulse Compact Streak for ${safeUser}</title>
  <desc id="cp-desc-${safeId}">${safeUser} has a current streak of ${stats.currentStreak} days.</desc>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600&amp;display=swap');
  ${googleFontsImport}
  .cp-compact-title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: ${text}; font-size: 15px; font-weight: 700; letter-spacing: 1px; opacity: 0.9; }
  .cp-compact-streak { font-family: ${statsFont}; fill: ${accent}; font-size: 20px; font-weight: 600; }
  </style>
  <rect width="${width}" height="${height}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bg}" ${borderAttr} />
  <text x="20" y="42" class="cp-compact-title">${titleText}</text>
  <text x="20" y="70" class="cp-compact-streak">${'\u{1F525}'} ${stats.currentStreak}d streak</text>
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
  const selectedFont = resolveFont(sanitizedFont);
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const googleFontUrlPart = sanitizedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';
  const sf = getSizeScale(params.size);
  const radius = sanitizeRadius(params.radius, 8) * sf;
  const labels = getLabels(params.lang);
  const W = Math.round(SVG_WIDTH * sf);
  const labelVisible = params.label !== false;
  const H = Math.round((labelVisible ? SVG_HEIGHT : SVG_HEIGHT - 40) * sf);
  const yOffset = params.label === false ? -40 : 0;
  const towerData = scaleTowerData(
    computeTowers(calendar, params.scale, stats.todayDate, params.mode),
    sf
  );
  const towers = renderTowers(towerData, params, '', '', sf, true, params.opacity ?? 1.0);

  const s = createScaler(sf);
  const fs = (n: number): number => Math.round(n * sf * 10) / 10;

  const safeId = safeUser.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();

  const displayTitle = params.custom_title
    ? sanitizeCustomText(params.custom_title)
    : truncateUsername(safeUser).toUpperCase();

  const titleText = `${displayTitle}${
    params.isOfflineFallback
      ? '<tspan fill="#ff9f43" font-size="10px" font-weight="bold"> [STALE CACHE]</tspan>'
      : ''
  }`;

  const titleFontSize = getUsernameFontSize(params.custom_title || truncateUsername(safeUser));

  let subtitleElement = '';
  if (params.custom_subtitle && !params.hide_title && params.label !== false) {
    const safeSubtitle = sanitizeCustomText(params.custom_subtitle);
    subtitleElement = `\n  <text x="${s(300)}" y="${s(68)}" text-anchor="middle" class="subtitle">${safeSubtitle}</text>`;
  }

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${W}"
  height="${H}"
  viewBox="0 0 ${W} ${H}"
  fill="none"
  role="img"
  aria-labelledby="cp-title-${safeId}"
  aria-describedby="cp-desc-${safeId}"
>
  ${renderHeader(safeUser, stats, sf, params, safeId)}

  <style>
@import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}
  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; --cp-label-fill: ${lightLabelFill}; --cp-label-opacity: ${lightLabelOpacity}; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; --cp-label-fill: ${darkLabelFill}; --cp-label-opacity: ${darkLabelOpacity}; } }
  .cp-bg-fill { fill: var(--cp-bg); } .cp-text-fill { fill: var(--cp-text); color: var(--cp-text); } .cp-accent-fill { fill: var(--cp-accent); color: var(--cp-accent); }
  ${getTowerAnimationCSS(params.entrance || 'rise', sf)}
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
  .subtitle { font-family: "Roboto", sans-serif; fill: var(--cp-label-fill); font-size: ${fs(10)}px; font-weight: 400; letter-spacing: ${fs(2)}px; opacity: calc(var(--cp-label-opacity) - 0.1); }
  .stats { font-family: ${statsFont}; fill: var(--cp-text); font-size: ${fs(42)}px; font-weight: 500; letter-spacing: 0; }
  .total-val { font-family: ${statsFont}; fill: var(--cp-accent); font-size: ${fs(24)}px; font-weight: 500; }
  .label { font-family: "Roboto", sans-serif; fill: var(--cp-label-fill); font-size: ${fs(11)}px; font-weight: 400; letter-spacing: ${fs(2)}px; opacity: var(--cp-label-opacity); }
  .isometric-label { font-family: ${selectedFont || '"Roboto", sans-serif'}; font-size: ${fs(10)}px; font-weight: 400; letter-spacing: 1px; fill-opacity: 0.6; }
  .dimmed-tower { opacity: 0.3; }
  ${getInteractiveTowerCSS('var(--cp-accent)')}

  @media (prefers-reduced-motion: reduce) {
    .heat-particles { display: none; }
    .scan-line {
      animation: none !important;
      transition: none !important;
      transform: translateY(var(--scan-start, ${s(0)}px)) !important;
    }
    .cp-tower animate { display: none; }
    .interactive-tower { transition: none !important; }
  }
  </style>

  <rect width="${W}" height="${H}" rx="${radius}" ${params.hideBackground ? 'fill="transparent"' : 'class="cp-bg-fill"'} />
  <g id="cp-towers" style="transform-origin: center; transform-box: fill-box;" transform="translate(0, ${s(20 + yOffset)})">
    ${towers}
  </g>
  ${renderIsometricLabels(calendar, params, 'var(--cp-text)', sf)}
  ${!params.hide_stats ? renderStatsSection(stats, labels, s, params) : ''}
${
  !params.hide_title && params.label !== false
    ? `<text x="${s(300)}" y="${s(50)}" text-anchor="middle" class="title" font-size="${fs(titleFontSize)}" style="font-size: ${fs(titleFontSize)}px;">${titleText}</text>`
    : ''
}
${subtitleElement}
${renderRadarScan(params.speed, sf, '', true)}
${renderMilestoneBadges(stats, params, sf)}
</svg>
`;
}

function computeDeltaText(
  stats: MonthlyStats,
  deltaUnit: string,
  deltaFormat: BadgeParams['delta_format']
): string {
  if (deltaFormat === 'absolute') {
    return stats.deltaAbsolute > 0
      ? `+${stats.deltaAbsolute} ${deltaUnit}`
      : stats.deltaAbsolute === 0
        ? `0 ${deltaUnit}`
        : `${stats.deltaAbsolute} ${deltaUnit}`;
  }

  if (deltaFormat === 'both') {
    return stats.deltaPercentage === null
      ? `N/A (${stats.deltaAbsolute > 0 ? '+' : ''}${stats.deltaAbsolute})`
      : stats.deltaPercentage > 0
        ? `+${stats.deltaPercentage}% (+${stats.deltaAbsolute})`
        : stats.deltaPercentage < 0
          ? `${stats.deltaPercentage}% (${stats.deltaAbsolute})`
          : `0% (${stats.deltaAbsolute > 0 ? '+' : ''}${stats.deltaAbsolute})`;
  }

  return stats.deltaPercentage === null
    ? 'N/A'
    : stats.deltaPercentage > 0
      ? `+${stats.deltaPercentage}%`
      : stats.deltaPercentage < 0
        ? `${stats.deltaPercentage}%`
        : `0%`;
}

export function generateMonthlySVG(stats: MonthlyStats, params: BadgeParams): string {
  if (params.autoTheme) {
    return generateAutoThemeMonthlySVG(stats, params);
  }

  const safeUser = escapeXML(params.user || 'GitHub User');
  const bg = `#${sanitizeHexColor(params.bg, '0d1117')}`;
  const bgFill =
    params.bgType === 'linear' || params.bgType === 'radial' ? 'url(#canvas-gradient)' : bg;

  const rawAccent = Array.isArray(params.accent)
    ? params.accent[params.accent.length - 1]
    : params.accent;
  const accent = `#${sanitizeHexColor(rawAccent, '00ffaa')}`;

  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;

  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const isPredefinedFont = isBundledFont(sanitizedFont);
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const radius = sanitizeRadius(params.radius, 8);
  const labels = getLabels(params.lang);

  const width = params.width || 300;
  const height = params.height || 120;

  const googleFontUrlPart =
    sanitizedFont && !isPredefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const commitsLabel =
    params.mode === 'loc' ? 'LINES THIS MONTH (EST.)' : labels.COMMITS_THIS_MONTH;
  const deltaUnit = params.mode === 'loc' ? 'LINES (EST.)' : 'commits';

  const deltaText = computeDeltaText(stats, deltaUnit, params.delta_format);
  let negativeColor = '#ff4444';
  const cleanBg = sanitizeHexColor(params.bg, '0d1117');
  const matchedTheme = Object.values(themes).find(
    (t) => t.bg.toLowerCase() === cleanBg.toLowerCase()
  );

  if (matchedTheme && matchedTheme.negative) {
    negativeColor = `#${matchedTheme.negative}`;
  } else {
    const luminance = getLuminance(cleanBg);
    negativeColor = luminance > 0.5 ? '#cf222e' : '#f85149';
  }

  const deltaColor = stats.deltaAbsolute >= 0 ? accent : negativeColor;

  const safeId = safeUser.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  fill="none"
  role="img"
  aria-labelledby="cp-title-${safeId}"
  aria-describedby="cp-desc-${safeId}"
>
  <title id="cp-title-${safeId}">Monthly Stats for ${safeUser}</title>
  <desc id="cp-desc-${safeId}">Monthly stats for ${safeUser}: ${stats.currentMonthTotal} ${commitsLabel} vs previous month delta of ${deltaText}.</desc>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}

  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: ${text}; font-size: 14px; letter-spacing: 2px; font-weight: 400; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: ${accent}; font-size: 36px; font-weight: 600; letter-spacing: 0; }
  .label { font-family: "Roboto", sans-serif; fill: ${text}; font-size: 10px; font-weight: 400; letter-spacing: 1px; opacity: 0.7; }
  .delta { font-family: "Roboto", sans-serif; fill: ${deltaColor}; font-size: 12px; font-weight: 500; }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
  }
  </style>

  <rect width="${width}" height="${height}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bgFill}" />

  <text x="20" y="40" class="title">${escapeXML(stats.currentMonthName.toUpperCase())}</text>
  <text x="20" y="85" class="stats">${stats.currentMonthTotal}</text>
  <text x="20" y="105" class="label">${commitsLabel}</text>

  <g transform="translate(${width - 20}, 80)" text-anchor="end">
    <text class="delta">${deltaText}</text>
    <text y="20" class="label">${labels.VS_LAST_MONTH}</text>
  </g>
</svg>
`;
}

export function generateMonthlyBadge(stats: MonthlyStats, params: BadgeParams): string {
  return generateMonthlySVG(stats, params);
}

export function generateWrappedSVG(
  stats: import('../../types/dashboard').WrappedStats,
  params: BadgeParams,
  year: string,
  calendar: ContributionCalendar
): string {
  const safeUser = escapeXML(params.user || 'GitHub User');
  const bg = `#${sanitizeHexColor(params.bg, '0d1117')}`;
  const bgFill =
    params.bgType === 'linear' || params.bgType === 'radial' ? 'url(#canvas-gradient)' : bg;

  const rawAccent = Array.isArray(params.accent)
    ? params.accent[params.accent.length - 1]
    : params.accent;
  const accent = `#${sanitizeHexColor(rawAccent, '00ffaa')}`;

  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;

  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const isPredefinedFont = isBundledFont(sanitizedFont);
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const radius = sanitizeRadius(params.radius, 8);

  const width = params.width || 420;
  const height = params.height || 260;

  const googleFontUrlPart =
    sanitizedFont && !isPredefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const MONTH_NAMES: Record<string, string> = {
    '01': 'JANUARY',
    '02': 'FEBRUARY',
    '03': 'MARCH',
    '04': 'APRIL',
    '05': 'MAY',
    '06': 'JUNE',
    '07': 'JULY',
    '08': 'AUGUST',
    '09': 'SEPTEMBER',
    '10': 'OCTOBER',
    '11': 'NOVEMBER',
    '12': 'DECEMBER',
  };
  const monthPart = stats.busiestMonth?.split('-')[1];
  const monthName = monthPart
    ? MONTH_NAMES[monthPart] || stats.busiestMonth
    : stats.busiestMonth || 'N/A';

  function formatActiveDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    const mPart = parts[1];
    const dPart = parts[2];
    if (!mPart || !dPart) return dateStr;
    const monthAbbrs: Record<string, string> = {
      '01': 'Jan',
      '02': 'Feb',
      '03': 'Mar',
      '04': 'Apr',
      '05': 'May',
      '06': 'Jun',
      '07': 'Jul',
      '08': 'Aug',
      '09': 'Sep',
      '10': 'Oct',
      '11': 'Nov',
      '12': 'Dec',
    };
    const m = monthAbbrs[mPart] || mPart;
    return `${m} ${parseInt(dPart, 10)}`;
  }
  const formattedPeakDate = formatActiveDate(stats.mostActiveDate);

  const radiusCircle = 14;
  const circ = 2 * Math.PI * radiusCircle;
  const clampedRatio = Math.max(0, Math.min(stats.weekendRatio || 0, 100));
  const strokeDashoffset = circ - (clampedRatio / 100) * circ;

  const sf = 0.45;
  const rawTowers = computeTowers(calendar, params.scale, '', 'commits');
  let bgTowersMarkup = '';
  const resolvedSolidColor = accent;
  for (const t of rawTowers) {
    const scaleHeight = t.h * sf;
    const scaleX = Math.round(t.x * sf) - 50;
    const scaleY = Math.round(t.y * sf) + 80;

    const leftFaceOpacity = t.isGhost ? 0.01 : 0.015;
    const rightFaceOpacity = t.isGhost ? 0.005 : 0.01;
    const topFaceOpacity = t.isGhost ? 0.02 : 0.035;
    const strokeOpacity = t.isGhost ? 0.03 : 0.02;

    const paths = buildTowerPaths(scaleHeight, 0.45);

    bgTowersMarkup += `
        <g transform="translate(${scaleX}, ${scaleY})">
          <path d="${paths.left}" fill="${resolvedSolidColor}" fill-opacity="${leftFaceOpacity}" stroke="${resolvedSolidColor}" stroke-opacity="${strokeOpacity}" stroke-width="0.22" />
          <path d="${paths.right}" fill="${resolvedSolidColor}" fill-opacity="${rightFaceOpacity}" stroke="${resolvedSolidColor}" stroke-opacity="${strokeOpacity}" stroke-width="0.22" />
          <path d="${paths.top}" fill="${resolvedSolidColor}" fill-opacity="${topFaceOpacity}" stroke="${resolvedSolidColor}" stroke-opacity="${strokeOpacity}" stroke-width="0.22" />
        </g>`;
  }

  const borderAttr = params.border
    ? `stroke="#${sanitizeHexColor(params.border, '58a6ff')}" stroke-width="1.5"`
    : `stroke="${accent}" stroke-opacity="0.15" stroke-width="1.5"`;

  const autoThemeVariables = params.autoTheme
    ? `
    :root { --cp-bg: #${AUTO_THEME_LIGHT.bg}; --cp-text: #${AUTO_THEME_LIGHT.text}; --cp-accent: #${AUTO_THEME_LIGHT.accent}; }
    @media (prefers-color-scheme: dark) { :root { --cp-bg: #${AUTO_THEME_DARK.bg}; --cp-text: #${AUTO_THEME_DARK.text}; --cp-accent: #${AUTO_THEME_DARK.accent}; } }
    .cp-bg-fill { fill: var(--cp-bg); }
    .cp-text-fill { fill: var(--cp-text); }
    .cp-accent-fill { fill: var(--cp-accent); }
    .cp-accent-stroke { stroke: var(--cp-accent); }
  `
    : '';

  const rectFill = params.autoTheme
    ? 'class="cp-bg-fill"'
    : `fill="${params.hideBackground ? 'transparent' : bgFill}"`;
  const textClass = params.autoTheme ? 'class="cp-text-fill"' : `fill="${text}"`;
  const accentClass = params.autoTheme ? 'class="cp-accent-fill"' : `fill="${accent}"`;
  const borderStroke = params.autoTheme
    ? 'class="cp-accent-stroke" stroke-opacity="0.15" stroke-width="1.5"'
    : borderAttr;

  const safeId = safeUser.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();
  const filterGlow =
    params.glow !== false
      ? `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>`
      : '';

  const glowAttr = params.glow !== false ? ' filter="url(#glow)"' : '';

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 420 260"
  fill="none"
  role="img"
  aria-labelledby="cp-title-${safeId}"
  aria-describedby="cp-desc-${safeId}"
>
  <title id="cp-title-${safeId}">${safeUser}'s GitHub Wrapped ${year}</title>
  <desc id="cp-desc-${safeId}">GitHub Wrapped stats for ${safeUser} in ${year}: ${stats.totalContributions} total contributions, top language is ${escapeXML(stats.topLanguage || 'Unknown')}, busiest month is ${escapeXML(stats.busiestMonth || 'Unknown')}.</desc>
  <defs>
    ${filterGlow}
  </defs>

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@700&amp;family=Space+Grotesk:wght@500;600;700&amp;display=swap');
  ${googleFontsImport}
  ${autoThemeVariables}

  .title-user { font-family: ${selectedFont || '"Syncopate", sans-serif'}; font-weight: 700; font-size: 13px; letter-spacing: 2.5px; opacity: 0.85; }
  .title-wrapped { font-family: ${selectedFont || '"Syncopate", sans-serif'}; font-weight: 700; font-size: 13px; letter-spacing: 2.5px; }

  .total-commits { font-family: ${statsFont}; font-size: 46px; font-weight: 700; }
  .total-label { font-family: "Roboto", sans-serif; font-size: 9.5px; font-weight: 700; letter-spacing: 1.5px; opacity: 0.5; }

  .grid-label { font-family: "Roboto", sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; opacity: 0.5; }
  .grid-val { font-family: ${statsFont}; font-size: 14.5px; font-weight: 600; }

  .scan-line {
    animation: scan-sweep var(--scan-speed, 8s) linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  @keyframes scan-sweep {
    from { transform: translateY(0px); }
    to { transform: translateY(230px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .scan-line { animation: none !important; display: none; }
  }
  </style>

  <rect width="420" height="260" rx="${radius}" ${rectFill} ${borderStroke} />

  <g opacity="0.8">
    ${bgTowersMarkup}
  </g>

  <rect
    x="15"
    y="15"
    width="390"
    height="1"
    ${accentClass}
    class="scan-line"
    fill-opacity="0.18"
    style="--scan-speed: ${sanitizeSpeed(params.speed)};"
  />

  <g transform="translate(25, 45)">
    <text x="0" y="0" class="title-user" ${textClass}>${safeUser.toUpperCase()}'S GRIND</text>
    <text x="370" y="0" text-anchor="end" class="title-wrapped" ${accentClass}>${year} WRAPPED</text>
    <line x1="0" y1="12" x2="370" y2="12" stroke="${params.autoTheme ? 'var(--cp-accent)' : accent}" stroke-opacity="0.15" stroke-width="1" />
  </g>

  <g transform="translate(25, 120)">
    <text x="0" y="15" class="total-commits" ${accentClass}${glowAttr}>${stats.totalContributions}</text>
    <text x="2" y="38" class="total-label" ${textClass}>TOTAL CONTRIBUTIONS</text>
  </g>

  <line x1="185" y1="80" x2="185" y2="230" stroke="${params.autoTheme ? 'var(--cp-accent)' : accent}" stroke-opacity="0.12" stroke-width="1" stroke-dasharray="3 3" />

  <g transform="translate(210, 80)">
    <g transform="translate(0, 20)">
      <text x="0" y="0" class="grid-label" ${textClass}>TOP LANGUAGE</text>
      <text x="0" y="20" class="grid-val" ${accentClass}>${escapeXML(stats.topLanguage || 'Unknown')}</text>
    </g>

    <g transform="translate(130, 20)">
      <text x="0" y="0" class="grid-label" ${textClass}>WEEKEND GRIND</text>
      <g transform="translate(25, 24)">
        <circle cx="0" cy="0" r="14" stroke="${params.autoTheme ? 'var(--cp-text)' : text}" stroke-opacity="0.1" stroke-width="2.5" fill="none" />
        <circle cx="0" cy="0" r="14" stroke="${params.autoTheme ? 'var(--cp-accent)' : accent}" stroke-width="3" fill="none"
                stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${strokeDashoffset.toFixed(2)}"
                stroke-linecap="round" transform="rotate(-90)" />
        <text x="0" y="3.5" text-anchor="middle" font-family="${statsFont.replace(/"/g, "'")}" font-size="9" font-weight="700" ${textClass}>${clampedRatio}%</text>
      </g>
    </g>
  </g>

  <g transform="translate(210, 150)">
    <text x="0" y="0" class="grid-label" ${textClass}>PEAK DAY</text>
    <text x="0" y="20" class="grid-val" ${textClass}>
      ${stats.highestDailyCount} COMMITS
      <tspan font-size="10.5" font-weight="500" ${accentClass} opacity="0.8">ON ${escapeXML(formattedPeakDate.toUpperCase())}</tspan>
    </text>
  </g>

  <g transform="translate(210, 205)">
    <text x="0" y="0" class="grid-label" ${textClass}>BUSIEST MONTH</text>
    <text x="0" y="20" class="grid-val" ${textClass}>
      ${escapeXML(monthName)}
      <tspan font-size="11" font-weight="500" ${accentClass}>🔥</tspan>
    </text>
  </g>
</svg>
`;
}

function generateAutoThemeMonthlySVG(stats: MonthlyStats, params: BadgeParams): string {
  const light = AUTO_THEME_LIGHT;
  const dark = AUTO_THEME_DARK;
  const safeUser = escapeXML(params.user || 'GitHub User');
  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);

  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const googleFontUrlPart = sanitizedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';
  const radius = sanitizeRadius(params.radius, 8);
  const labels = getLabels(params.lang);

  const width = params.width || 300;
  const height = params.height || 120;

  const commitsLabel =
    params.mode === 'loc' ? 'LINES THIS MONTH (EST.)' : labels.COMMITS_THIS_MONTH;
  const deltaUnit = params.mode === 'loc' ? 'LINES (EST.)' : 'commits';

  const deltaText = computeDeltaText(stats, deltaUnit, params.delta_format);

  const safeId = safeUser.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  fill="none"
  role="img"
  aria-labelledby="cp-title-${safeId}"
  aria-describedby="cp-desc-${safeId}"
>
  <title id="cp-title-${safeId}">Monthly Stats for ${safeUser}</title>
  <desc id="cp-desc-${safeId}">Monthly stats for ${safeUser}: ${stats.currentMonthTotal} ${commitsLabel} vs previous month delta of ${deltaText}.</desc>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}
  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; --cp-negative: #${light.negative || 'cf222e'}; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; --cp-negative: #${dark.negative || 'f85149'}; } }
  .cp-bg-fill { fill: var(--cp-bg); }
  .cp-text-fill { fill: var(--cp-text); color: var(--cp-text); }
  .cp-accent-fill { fill: var(--cp-accent); color: var(--cp-accent); }
  .cp-delta-fill { fill: ${stats.deltaAbsolute >= 0 ? 'var(--cp-accent)' : 'var(--cp-negative)'}; }

  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: var(--cp-text); font-size: 14px; letter-spacing: 2px; font-weight: 400; opacity: 0.8; }
  .stats { font-family: ${statsFont}; fill: var(--cp-accent); font-size: 36px; font-weight: 600; letter-spacing: 0; }
  .label { font-family: "Roboto", sans-serif; fill: var(--cp-text); font-size: 10px; font-weight: 400; letter-spacing: 1px; opacity: 0.7; }
  .delta { font-family: "Roboto", sans-serif; font-size: 12px; font-weight: 500; }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
  }
  </style>

  <rect width="${width}" height="${height}" rx="${radius}" ${params.hideBackground ? 'fill="transparent"' : 'class="cp-bg-fill"'} />

  <text x="20" y="40" class="title">${escapeXML(stats.currentMonthName.toUpperCase())}</text>
  <text x="20" y="85" class="stats">${stats.currentMonthTotal}</text>
  <text x="20" y="105" class="label">${commitsLabel}</text>

  <g transform="translate(${width - 20}, 80)" text-anchor="end">
    <text class="delta cp-delta-fill">${deltaText}</text>
    <text y="20" class="label">${labels.VS_LAST_MONTH}</text>
  </g>
</svg>
`;
}

const HEATMAP_CELL_SIZE = 16;
const HEATMAP_CELL_GAP = 3;
const HEATMAP_CELL_RADIUS = 2;
const HEATMAP_GRID_ORIGIN_X = 60;
const HEATMAP_GRID_ORIGIN_Y = 55;
const HEATMAP_WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const HEATMAP_OPACITIES = [0.06, 0.3, 0.55, 0.8, 1.0];
const HEATMAP_MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function computeHeatmapIntensity(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount <= 4) return Math.min(4, count);
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function renderHeatmapGrid(
  calendar: ContributionCalendar,
  accent: string,
  text: string,
  sf: number,
  todayDate: string,
  mode: 'commits' | 'loc' = 'commits',
  isAutoTheme: boolean = false,
  glow: boolean = true
): string {
  const weeks = calendar.weeks.slice(-14);
  const cellSize = Math.round(HEATMAP_CELL_SIZE * sf);
  const cellGap = Math.round(HEATMAP_CELL_GAP * sf);
  const cellRadius = Math.round(HEATMAP_CELL_RADIUS * sf);
  const originX = Math.round(HEATMAP_GRID_ORIGIN_X * sf);
  const originY = Math.round(HEATMAP_GRID_ORIGIN_Y * sf);
  const step = cellSize + cellGap;

  let maxCount = 0;
  weeks.forEach((week) => {
    week.contributionDays.forEach((day) => {
      const count =
        mode === 'loc' ? (day.locAdditions || 0) + (day.locDeletions || 0) : day.contributionCount;
      if (count > maxCount) maxCount = count;
    });
  });

  const todayInWindow = weeks.some((w) => w.contributionDays.some((d) => d.date === todayDate));

  let cells = '';
  let monthHeaders = '';
  let prevMonth = '';

  weeks.forEach((week, col) => {
    week.contributionDays.forEach((day, row) => {
      const count =
        mode === 'loc' ? (day.locAdditions || 0) + (day.locDeletions || 0) : day.contributionCount;
      const intensity = computeHeatmapIntensity(count, maxCount);
      const opacity = HEATMAP_OPACITIES[intensity];
      const x = originX + col * step;
      const y = originY + row * step;

      const isToday =
        day.date === todayDate ||
        (!todayInWindow && col === weeks.length - 1 && row === week.contributionDays.length - 1);

      const [yr, m, d] = day.date.split('-');
      const formattedDate = `${MONTH_NAMES[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
      const unit = mode === 'loc' ? 'est. lines of code' : 'commits';
      const tooltipPrefix = isToday ? 'TODAY: ' : '';
      const tooltip = `${tooltipPrefix}${formattedDate}: ${count} ${unit}`;

      const fillAttr = isAutoTheme ? 'fill="var(--cp-accent)"' : `fill="${accent}"`;
      const filterAttr = intensity === 4 && glow !== false ? ' filter="url(#hm-glow)"' : '';

      cells += `
      <rect
        x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${cellRadius}"
        ${fillAttr} fill-opacity="${opacity}"${filterAttr}
        class="hm-cell${isToday ? ' hm-today' : ''}"
        data-date="${escapeXML(day.date)}" data-count="${count}"
      >
        <title>${escapeXML(tooltip)}</title>
      </rect>`;
    });

    if (week.contributionDays.length > 0) {
      const firstDay = week.contributionDays[0];
      const monthNum = parseInt(firstDay.date.substring(5, 7), 10);
      const monthStr = HEATMAP_MONTH_NAMES_SHORT[monthNum - 1];
      if (monthStr !== prevMonth) {
        const mx = originX + col * step;
        const my = originY - Math.round(8 * sf);
        const labelFill = isAutoTheme ? 'var(--cp-text)' : text;
        monthHeaders += `
      <text x="${mx}" y="${my}" fill="${labelFill}" font-size="${Math.round(9 * sf)}px" font-family="'Roboto', sans-serif" opacity="0.6">${monthStr}</text>`;
        prevMonth = monthStr;
      }
    }
  });

  let weekdayLabels = '';
  HEATMAP_WEEKDAY_LABELS.forEach((label, row) => {
    if (!label) return;
    const ly = originY + row * step + Math.round(cellSize * 0.75);
    const lx = originX - Math.round(8 * sf);
    const labelFill = isAutoTheme ? 'var(--cp-text)' : text;
    weekdayLabels += `
    <text x="${lx}" y="${ly}" text-anchor="end" fill="${labelFill}" font-size="${Math.round(9 * sf)}px" font-family="'Roboto', sans-serif" opacity="0.6">${label}</text>`;
  });

  return `<g class="hm-grid">
    ${monthHeaders}
    ${weekdayLabels}
    ${cells}
  </g>`;
}

function renderHeatmapLegend(
  accent: string,
  text: string,
  sf: number,
  x: number,
  y: number,
  isAutoTheme: boolean = false
): string {
  const cellSize = Math.round(10 * sf);
  const gap = Math.round(3 * sf);
  const step = cellSize + gap;
  const fontSize = Math.round(9 * sf);
  const labelFill = isAutoTheme ? 'var(--cp-text)' : text;
  const fillAttr = isAutoTheme ? 'var(--cp-accent)' : accent;

  let legend = `<g transform="translate(${x}, ${y})">
    <text x="0" y="${Math.round(cellSize * 0.75)}" fill="${labelFill}" font-size="${fontSize}px" font-family="'Roboto', sans-serif" opacity="0.5">Less</text>`;

  const lessTextWidth = Math.round(28 * sf);
  HEATMAP_OPACITIES.forEach((opacity, i) => {
    const cx = lessTextWidth + i * step;
    legend += `
    <rect x="${cx}" y="0" width="${cellSize}" height="${cellSize}" rx="${Math.round(2 * sf)}" fill="${fillAttr}" fill-opacity="${opacity}" />`;
  });

  const moreX = lessTextWidth + HEATMAP_OPACITIES.length * step + Math.round(4 * sf);
  legend += `
    <text x="${moreX}" y="${Math.round(cellSize * 0.75)}" fill="${labelFill}" font-size="${fontSize}px" font-family="'Roboto', sans-serif" opacity="0.5">More</text>
  </g>`;

  return legend;
}

export function generateHeatmapSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  if (params.autoTheme) return generateAutoThemeHeatmapSVG(stats, params, calendar);

  const safeUser = escapeXML(params.user || 'GitHub User');
  const bg = `#${sanitizeHexColor(params.bg, '0d1117')}`;
  const bgFill =
    params.bgType === 'linear' || params.bgType === 'radial' ? 'url(#canvas-gradient)' : bg;

  const rawAccent = Array.isArray(params.accent)
    ? params.accent[params.accent.length - 1]
    : params.accent;
  const accent = `#${sanitizeHexColor(rawAccent, '00ffaa')}`;
  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;

  const borderAttr = params.border
    ? `stroke="#${sanitizeHexColor(params.border, '000000')}" stroke-width="2"`
    : '';

  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const isPredefinedFont = isBundledFont(sanitizedFont);
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const googleFontUrlPart =
    sanitizedFont && !isPredefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const sf = getSizeScale(params.size);
  const radius = sanitizeRadius(params.radius, 8) * sf;
  const labels = getLabels(params.lang);
  const W = Math.round(600 * sf);
  const H = Math.round(300 * sf);
  const s = createScaler(sf);

  const isLightBg = getLuminance(bg) > 0.5;
  const labelFill = isLightBg ? text : accent;
  const labelOpacity = isLightBg ? 0.8 : 0.7;

  const grid = renderHeatmapGrid(
    calendar,
    accent,
    text,
    sf,
    stats.todayDate,
    params.mode,
    false,
    params.glow !== false
  );
  const legend = renderHeatmapLegend(accent, text, sf, s(60), s(270), false);

  const unit = params.mode === 'loc' ? 'est. lines of code' : 'total contributions';

  const filterGlow =
    params.glow !== false
      ? `<filter id="hm-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${Math.round(3 * sf)}" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>`
      : '';

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img">
  <title>CommitPulse Heatmap for ${safeUser}</title>
  <desc>${safeUser} has ${stats.totalContributions} ${unit} and a longest streak of ${stats.longestStreak} days.</desc>

  <defs>
    ${filterGlow}
  </defs>

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}

  .hm-title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: ${text}; font-size: ${s(14)}px; letter-spacing: ${s(4)}px; font-weight: 400; opacity: 0.8; }
  .hm-stats-val { font-family: ${statsFont}; fill: ${text}; font-size: ${s(28)}px; font-weight: 500; }
  .hm-total-val { font-family: ${statsFont}; fill: ${accent}; font-size: ${s(18)}px; font-weight: 500; }
  .hm-label { font-family: "Roboto", sans-serif; fill: ${labelFill}; font-size: ${s(9)}px; font-weight: 400; letter-spacing: ${s(1.5)}px; opacity: ${labelOpacity}; }
  .hm-cell { transition: filter 0.2s ease; }
  .hm-cell:hover { filter: brightness(1.3) drop-shadow(0 0 4px ${accent}66); }
  .hm-today {
    stroke: ${accent};
    stroke-width: ${Math.round(1.5 * sf)};
    stroke-opacity: 0.9;
    animation: hm-pulse 1.5s ease-in-out infinite;
  }
  @keyframes hm-pulse {
    0%, 100% { stroke-opacity: 0.9; }
    50% { stroke-opacity: 0.3; }
  }
  .hm-scan {
    animation: hm-scan-sweep var(--scan-speed, 8s) linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  @keyframes hm-scan-sweep {
    from { transform: translateX(0px); }
    to { transform: translateX(${s(266)}px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .hm-today { animation: none !important; }
    .hm-scan { animation: none !important; display: none; }
  }
  </style>

  <rect width="${W}" height="${H}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bgFill}" ${borderAttr} />

  ${!params.hide_title ? `<text x="${s(60)}" y="${s(30)}" class="hm-title">${truncateUsername(safeUser).toUpperCase()}${params.isOfflineFallback ? '<tspan fill="#ff9f43" font-size="10px" font-weight="bold"> [STALE CACHE]</tspan>' : ''}</text>` : ''}

  ${grid}

  <rect
    x="${s(60)}" y="${s(55)}" width="${s(2)}" height="${s(133)}"
    fill="${accent}" fill-opacity="0.2"
    class="hm-scan"
    style="--scan-speed: ${sanitizeSpeed(params.speed)};"
  />

  ${
    !params.hide_stats
      ? `
  <g transform="translate(${s(60)}, ${s(220)})" text-anchor="start">
    <g>
      <text class="hm-label">${labels.CURRENT_STREAK}</text>
      <text y="${s(22)}" class="hm-stats-val">${stats.currentStreak}</text>
    </g>
    <g transform="translate(${s(160)}, 0)">
      <text class="hm-label">${params.mode === 'loc' ? 'TOTAL LINES OF CODE (EST.)' : labels.ANNUAL_SYNC_TOTAL}</text>
      <text y="${s(22)}" class="hm-total-val">${stats.totalContributions}</text>
    </g>
    <g transform="translate(${s(360)}, 0)">
      <text class="hm-label">${labels.PEAK_STREAK}</text>
      <text y="${s(22)}" class="hm-stats-val">${stats.longestStreak}</text>
    </g>
  </g>`
      : ''
  }

  ${legend}
</svg>`;
}

function generateAutoThemeHeatmapSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  const light = AUTO_THEME_LIGHT;
  const dark = AUTO_THEME_DARK;
  const safeUser = escapeXML(params.user || 'GitHub User');

  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const googleFontUrlPart = sanitizedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const sf = getSizeScale(params.size);
  const radius = sanitizeRadius(params.radius, 8) * sf;
  const labels = getLabels(params.lang);
  const W = Math.round(600 * sf);
  const H = Math.round(300 * sf);
  const s = createScaler(sf);

  const grid = renderHeatmapGrid(
    calendar,
    '',
    '',
    sf,
    stats.todayDate,
    params.mode,
    true,
    params.glow !== false
  );
  const legend = renderHeatmapLegend('', '', sf, s(60), s(270), true);

  const unit = params.mode === 'loc' ? 'est. lines of code' : 'total contributions';

  const filterGlow =
    params.glow !== false
      ? `<filter id="hm-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${Math.round(3 * sf)}" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>`
      : '';

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img">
  <title>CommitPulse Heatmap for ${safeUser}</title>
  <desc>${safeUser} has ${stats.totalContributions} ${unit} and a longest streak of ${stats.longestStreak} days.</desc>

  <defs>
    ${filterGlow}
  </defs>

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}

  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; } }
  .cp-bg-fill { fill: var(--cp-bg); }
  .cp-text-fill { fill: var(--cp-text); color: var(--cp-text); }
  .cp-accent-fill { fill: var(--cp-accent); color: var(--cp-accent); }

  .hm-title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: var(--cp-text); font-size: ${s(14)}px; letter-spacing: ${s(4)}px; font-weight: 400; opacity: 0.8; }
  .hm-stats-val { font-family: ${statsFont}; fill: var(--cp-text); font-size: ${s(28)}px; font-weight: 500; }
  .hm-total-val { font-family: ${statsFont}; fill: var(--cp-accent); font-size: ${s(18)}px; font-weight: 500; }
  .hm-label { font-family: "Roboto", sans-serif; fill: var(--cp-accent); font-size: ${s(9)}px; font-weight: 400; letter-spacing: ${s(1.5)}px; opacity: 0.7; }
  .hm-cell { transition: filter 0.2s ease; }
  .hm-cell:hover { filter: brightness(1.3) drop-shadow(0 0 4px var(--cp-accent)); }
  .hm-today {
    stroke: var(--cp-accent);
    stroke-width: ${Math.round(1.5 * sf)};
    stroke-opacity: 0.9;
    animation: hm-pulse 1.5s ease-in-out infinite;
  }
  @keyframes hm-pulse {
    0%, 100% { stroke-opacity: 0.9; }
    50% { stroke-opacity: 0.3; }
  }
  .hm-scan {
    animation: hm-scan-sweep var(--scan-speed, 8s) linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  @keyframes hm-scan-sweep {
    from { transform: translateX(0px); }
    to { transform: translateX(${s(266)}px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .hm-today { animation: none !important; }
    .hm-scan { animation: none !important; display: none; }
  }
  </style>

  <rect width="${W}" height="${H}" rx="${radius}" ${params.hideBackground ? 'fill="transparent"' : 'class="cp-bg-fill"'} />

  ${!params.hide_title ? `<text x="${s(60)}" y="${s(30)}" class="hm-title">${truncateUsername(safeUser).toUpperCase()}${params.isOfflineFallback ? '<tspan fill="#ff9f43" font-size="10px" font-weight="bold"> [STALE CACHE]</tspan>' : ''}</text>` : ''}

  ${grid}

  <rect
    x="${s(60)}" y="${s(55)}" width="${s(2)}" height="${s(133)}"
    class="cp-accent-fill hm-scan"
    fill-opacity="0.2"
    style="--scan-speed: ${sanitizeSpeed(params.speed)};"
  />

  ${
    !params.hide_stats
      ? `
  <g transform="translate(${s(60)}, ${s(220)})" text-anchor="start">
    <g>
      <text class="hm-label">${labels.CURRENT_STREAK}</text>
      <text y="${s(22)}" class="hm-stats-val">${stats.currentStreak}</text>
    </g>
    <g transform="translate(${s(160)}, 0)">
      <text class="hm-label">${params.mode === 'loc' ? 'TOTAL LINES OF CODE (EST.)' : labels.ANNUAL_SYNC_TOTAL}</text>
      <text y="${s(22)}" class="hm-total-val">${stats.totalContributions}</text>
    </g>
    <g transform="translate(${s(360)}, 0)">
      <text class="hm-label">${labels.PEAK_STREAK}</text>
      <text y="${s(22)}" class="hm-stats-val">${stats.longestStreak}</text>
    </g>
  </g>`
      : ''
  }

  ${legend}
</svg>`;
}

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

function renderGhostTowers(
  layout: { col: number; row: number; h: number }[],
  accent: string
): string {
  let ghostTowers = '';
  for (const { col, row, h } of layout) {
    const tx = 300 + (col - row) * 16;
    const ty = 120 + (col + row) * TILE_HEIGHT_HALF;
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
  return `<g class="ghost-towers">${ghostTowers}</g>`;
}

export function generateNotFoundSVG(
  username: string,
  bg: string,
  accent: string,
  text: string,
  radius: number,
  speed: string = '8s'
): string {
  const safeSpeed = sanitizeSpeed(speed);
  const sanitizedUsername = username.replace(/[^a-zA-Z0-9\-]/g, '').slice(0, 39) || 'unknown';
  const safeName = escapeXML(sanitizedUsername.toUpperCase());
  const ghostTowersHtml = renderGhostTowers(GHOST_LAYOUT, accent);

  const safeId = safeName.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();

  return `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="100%"
  viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}"
  fill="none"
  role="img"
  aria-labelledby="cp-title-${safeId}"
  aria-describedby="cp-desc-${safeId}"
>
  <title id="cp-title-${safeId}">User not found — ${safeName}</title>
  <desc id="cp-desc-${safeId}">The GitHub user ${safeName} was not found or has no contribution data.</desc>
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="softglow" x="-80%" y="-80%" width="360%" height="360%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="ghostFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="30%" stop-color="${bg}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="1"/>
    </linearGradient>
  </defs>

  <style>
@import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600&amp;display=swap');    .title  { font-family: "Syncopate", sans-serif; fill: ${text}; font-size: 18px; letter-spacing: 6px; font-weight: 400; opacity: 0.5; }
    .label  { font-family: "Roboto", sans-serif; fill: ${accent}; font-size: 11px; letter-spacing: 2px; opacity: 0.4; }
    .stats  { font-family: "Space Grotesk", sans-serif; fill: ${text}; font-size: 42px; font-weight: 500; opacity: 0.2; }
    .ghost-pulse { animation: gp 2.6s ease-in-out infinite; }
    .scan-line { animation: scan-sweep var(--scan-speed, 8s) linear infinite; }
    @keyframes gp { 0%,100%{opacity:.55} 50%{opacity:1} }
    @keyframes scan-sweep { from { transform: translateY(0px); } to { transform: translateY(240px); } }
    @media (prefers-reduced-motion: reduce) {
      .ghost-pulse { animation: none !important; transition: none !important; }
      .scan-line {
        animation: none !important;
        transition: none !important;
        transform: translateY(0px) !important;
      }
    }
  </style>

  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="${radius}" fill="${bg}"/>

  <g transform="translate(0, 20)" class="ghost-pulse">
    ${ghostTowersHtml}
  </g>

  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="${radius}" fill="url(#ghostFade)"/>

  <rect x="100" y="80" width="400" height="1" class="scan-line" fill="${accent}" fill-opacity="0.12" style="--scan-speed: ${safeSpeed};"/>

  <text x="300" y="50" text-anchor="middle" class="title" font-size="${getUsernameFontSize(truncateUsername(sanitizedUsername))}" style="font-size: ${getUsernameFontSize(truncateUsername(sanitizedUsername))}px;">${escapeXML(truncateUsername(sanitizedUsername).toUpperCase())}</text>

  <rect x="180" y="62" width="240" height="1" fill="${accent}" fill-opacity="0.15"/>

  <circle cx="300" cy="190" r="32" fill="none"
    stroke="${accent}" stroke-width="1.2" stroke-opacity="0.3" filter="url(#softglow)"/>
  <line x1="286" y1="176" x2="314" y2="204"
    stroke="${accent}" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.55"/>
  <line x1="314" y1="176" x2="286" y2="204"
    stroke="${accent}" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.55"/>

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

  <g transform="translate(40, 340)">
    <text class="label">CURRENT_STREAK</text>
    <text y="40" class="stats">—</text>
  </g>
  <g transform="translate(300, 340)" text-anchor="middle">
    <text class="label">ANNUAL_SYNC_TOTAL</text>
    <text y="40" font-family="Space Grotesk,sans-serif" font-size="24"
      fill="${accent}" opacity="0.2">—</text>
  </g>
  <g transform="translate(500, 340)" text-anchor="middle">
    <text class="label">PEAK_STREAK</text>
    <text y="40" class="stats">—</text>
  </g>
</svg>`;
}

export function generateVersusSVG(
  stats1: StreakStats,
  stats2: StreakStats,
  params: BadgeParams,
  calendar1: ContributionCalendar,
  calendar2: ContributionCalendar
): string {
  if (params.autoTheme)
    return generateAutoThemeVersusSVG(stats1, stats2, params, calendar1, calendar2);

  const safeUser1 = escapeXML(params.user || 'User 1');
  const safeUser2 = escapeXML(params.versus || 'User 2');
  const bg = `#${sanitizeHexColor(params.bg, '0d1117')}`;
  const rawAccent = Array.isArray(params.accent)
    ? params.accent[params.accent.length - 1]
    : params.accent;
  const accent = `#${sanitizeHexColor(rawAccent, '00ffaa')}`;
  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;

  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const isPredefinedFont = isBundledFont(sanitizedFont);
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const googleFontUrlPart =
    sanitizedFont && !isPredefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const sf = getSizeScale(params.size);
  const radius = sanitizeRadius(params.radius, 8) * sf;
  const labels = getLabels(params.lang);

  const singleW = Math.round(SVG_WIDTH * sf);
  const W = singleW * 2;
  const H = Math.round(SVG_HEIGHT * sf);

  const towerData1 = scaleTowerData(
    computeTowers(calendar1, params.scale, stats1.todayDate, params.mode),
    sf
  );
  const towerData2 = scaleTowerData(
    computeTowers(calendar2, params.scale, stats2.todayDate, params.mode),
    sf
  );

  const towers1 = renderTowers(towerData1, params, accent, text, sf, false, params.opacity ?? 1.0);
  const towers2 = renderTowers(towerData2, params, accent, text, sf, false, params.opacity ?? 1.0);

  const s = createScaler(sf);
  const unit = params.mode === 'loc' ? 'est. lines of code' : 'total contributions';

  const safeId = `${safeUser1}_vs_${safeUser2}`.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();

  const isWinner1 = stats1.totalContributions > stats2.totalContributions;
  const isWinner2 = stats2.totalContributions > stats1.totalContributions;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-labelledby="cp-title-${safeId}" aria-describedby="cp-desc-${safeId}">
  <title id="cp-title-${safeId}">CommitPulse Versus Stats: ${safeUser1} vs ${safeUser2}</title>
  <desc id="cp-desc-${safeId}">${safeUser1} has ${stats1.totalContributions} ${unit}. ${safeUser2} has ${stats2.totalContributions} ${unit}.</desc>
  ${renderDefs(sf, params)}
  ${renderStyle(selectedFont, statsFont, googleFontsImport, text, accent, sf, bg, params.entrance || 'rise')}
  <rect width="${W}" height="${H}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bg}" />

  <g transform="translate(0, 0)">
    <g transform="translate(0, ${Math.round(20 * sf)})">${towers1}</g>
    ${renderIsometricLabels(calendar1, params, text, sf)}
    ${renderFooter(stats1, params, labels, safeUser1, accent, sf, isWinner1)}
  </g>

  <g transform="translate(${singleW}, 0)">
    <g transform="translate(0, ${Math.round(20 * sf)})">${towers2}</g>
    ${renderIsometricLabels(calendar2, params, text, sf)}
    ${renderFooter(stats2, params, labels, safeUser2, accent, sf, isWinner2)}
  </g>

  <line x1="${singleW}" y1="${s(40)}" x2="${singleW}" y2="${H - s(40)}" stroke="${text}" stroke-opacity="0.2" stroke-width="2" stroke-dasharray="4 4" />

  <g transform="translate(${singleW}, ${H / 2})">
    <circle cx="0" cy="0" r="${s(24)}" fill="${bg}" stroke="${accent}" stroke-width="2" />
    <text x="0" y="${s(6)}" text-anchor="middle" font-family="${statsFont}" fill="${accent}" font-size="${s(16)}" font-weight="bold">VS</text>
  </g>
</svg>`;
}

function generateAutoThemeVersusSVG(
  stats1: StreakStats,
  stats2: StreakStats,
  params: BadgeParams,
  calendar1: ContributionCalendar,
  calendar2: ContributionCalendar
): string {
  const light = AUTO_THEME_LIGHT;
  const dark = AUTO_THEME_DARK;
  const lightLabelFill = getLuminance(light.bg) > 0.5 ? 'var(--cp-text)' : 'var(--cp-accent)';
  const lightLabelOpacity = getLuminance(light.bg) > 0.5 ? '0.8' : '0.7';
  const darkLabelFill = getLuminance(dark.bg) > 0.5 ? 'var(--cp-text)' : 'var(--cp-accent)';
  const darkLabelOpacity = getLuminance(dark.bg) > 0.5 ? '0.8' : '0.7';
  const safeUser1 = escapeXML(params.user || 'User 1');
  const safeUser2 = escapeXML(params.versus || 'User 2');
  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const sf = getSizeScale(params.size);
  const radius = sanitizeRadius(params.radius, 8) * sf;
  const labels = getLabels(params.lang);

  const singleW = Math.round(SVG_WIDTH * sf);
  const W = singleW * 2;
  const H = Math.round(SVG_HEIGHT * sf);

  const towerData1 = scaleTowerData(
    computeTowers(calendar1, params.scale, stats1.todayDate, params.mode),
    sf
  );
  const towerData2 = scaleTowerData(
    computeTowers(calendar2, params.scale, stats2.todayDate, params.mode),
    sf
  );

  const towers1 = renderTowers(towerData1, params, '', '', sf, true, params.opacity ?? 1.0);
  const towers2 = renderTowers(towerData2, params, '', '', sf, true, params.opacity ?? 1.0);

  const s = createScaler(sf);
  const fs = (n: number): number => Math.round(n * sf * 10) / 10;
  const unit = params.mode === 'loc' ? 'est. lines of code' : 'total contributions';

  const safeId = `${safeUser1}_vs_${safeUser2}`.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();

  const isWinner1 = stats1.totalContributions > stats2.totalContributions;
  const isWinner2 = stats2.totalContributions > stats1.totalContributions;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-labelledby="cp-title-${safeId}" aria-describedby="cp-desc-${safeId}">
  <title id="cp-title-${safeId}">CommitPulse Versus Stats: ${safeUser1} vs ${safeUser2}</title>
  <desc id="cp-desc-${safeId}">${safeUser1} has ${stats1.totalContributions} ${unit}. ${safeUser2} has ${stats2.totalContributions} ${unit}.</desc>
  ${renderDefs(sf, params)}

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; --cp-label-fill: ${lightLabelFill}; --cp-label-opacity: ${lightLabelOpacity}; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; --cp-label-fill: ${darkLabelFill}; --cp-label-opacity: ${darkLabelOpacity}; } }
  .cp-bg-fill { fill: var(--cp-bg); } .cp-text-fill { fill: var(--cp-text); color: var(--cp-text); } .cp-accent-fill { fill: var(--cp-accent); color: var(--cp-accent); }
  ${getTowerAnimationCSS(params.entrance || 'rise', sf)}
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

  @media (prefers-reduced-motion: reduce) {
    .heat-particles { display: none; }
    .scan-line {
      animation: none !important;
      transition: none !important;
      transform: translateY(var(--scan-start, ${s(0)}px)) !important;
    }
  }
  </style>

  <rect width="${W}" height="${H}" rx="${radius}" class="${params.hideBackground ? '' : 'cp-bg-fill'}" fill="${params.hideBackground ? 'transparent' : ''}" />

  <g transform="translate(0, 0)">
    <g transform="translate(0, ${Math.round(20 * sf)})">${towers1}</g>
    ${renderIsometricLabels(calendar1, params, '', sf)}
    ${renderFooter(stats1, params, labels, safeUser1, '', sf, isWinner1)}
  </g>

  <g transform="translate(${singleW}, 0)">
    <g transform="translate(0, ${Math.round(20 * sf)})">${towers2}</g>
    ${renderIsometricLabels(calendar2, params, '', sf)}
    ${renderFooter(stats2, params, labels, safeUser2, '', sf, isWinner2)}
  </g>

  <line x1="${singleW}" y1="${s(40)}" x2="${singleW}" y2="${H - s(40)}" stroke="var(--cp-text)" stroke-opacity="0.2" stroke-width="2" stroke-dasharray="4 4" />

  <g transform="translate(${singleW}, ${H / 2})">
    <circle cx="0" cy="0" r="${s(24)}" class="cp-bg-fill" stroke="var(--cp-accent)" stroke-width="2" />
    <text x="0" y="${s(6)}" text-anchor="middle" font-family="${statsFont}" class="cp-accent-fill" font-size="${s(16)}" font-weight="bold">VS</text>
  </g>
</svg>`;
}

export function generatePulseSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  if (params.autoTheme) {
    return generateAutoThemePulseSVG(stats, params, calendar);
  }

  const safeUser = escapeXML(params.user || 'GitHub User');
  const bg = `#${sanitizeHexColor(params.bg, '0d1117')}`;

  const rawAccent = Array.isArray(params.accent)
    ? params.accent[params.accent.length - 1]
    : params.accent;
  const accent = `#${sanitizeHexColor(rawAccent, '00ffaa')}`;
  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;

  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const isPredefinedFont = isBundledFont(sanitizedFont);

  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50));

  const googleFontUrlPart =
    sanitizedFont && !isPredefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const width = params.width || 800;
  const height = params.height || 170;

  const days: number[] = [];
  calendar.weeks.forEach((week) => {
    week.contributionDays.forEach((day) => {
      days.push(
        params.mode === 'loc'
          ? (day.locAdditions || 0) + (day.locDeletions || 0)
          : day.contributionCount
      );
    });
  });

  const pulseDays = days.slice(-30);
  const pulseTotal = pulseDays.reduce((sum, count) => sum + count, 0);

  const maxCount = Math.max(...pulseDays, 1);
  const minCount = Math.min(...pulseDays);
  const range = maxCount - minCount || 1;

  const paddingX = 40;
  const paddingYTop = 80;
  const paddingYBottom = 30;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingYTop - paddingYBottom;

  const stepX = graphWidth / Math.max(pulseDays.length - 1, 1);

  let pathD = '';
  pulseDays.forEach((count, i) => {
    const x = paddingX + i * stepX;
    const normalized = (count - minCount) / range;
    const y = paddingYTop + graphHeight - normalized * graphHeight;

    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      const prevCount = pulseDays[i - 1];
      const prevNormalized = (prevCount - minCount) / range;
      const prevX = paddingX + (i - 1) * stepX;
      const prevY = paddingYTop + graphHeight - prevNormalized * graphHeight;

      const cp1X = prevX + stepX / 2;
      const cp1Y = prevY;
      const cp2X = x - stepX / 2;
      const cp2Y = y;

      pathD += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${x} ${y}`;
    }
  });

  const bottomY = paddingYTop + graphHeight;
  const lastX = paddingX + (pulseDays.length - 1) * stepX;
  const firstX = paddingX;
  const areaPathD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  const lastCount = pulseDays[pulseDays.length - 1] ?? 0;
  const lastNormalized = (lastCount - minCount) / range;
  const lastY = paddingYTop + graphHeight - lastNormalized * graphHeight;

  const safeId = safeUser.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  fill="none"
  role="img"
  aria-labelledby="cp-title-${safeId}"
  aria-describedby="cp-desc-${safeId}"
>
  <title id="cp-title-${safeId}">Heartbeat Sparkline for ${safeUser}</title>
  <desc id="cp-desc-${safeId}">Heartbeat sparkline for ${safeUser} showing commit activity over the last 30 days (total commits: ${pulseTotal}).</desc>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}

  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: ${text}; font-size: 16px; letter-spacing: 2px; font-weight: 700; opacity: 0.9; }
  .stats { font-family: ${statsFont}; fill: ${accent}; font-size: 28px; font-weight: 600; letter-spacing: 0; }
  .label { font-family: "Roboto", sans-serif; fill: ${text}; font-size: 10px; font-weight: 500; letter-spacing: 1.5px; opacity: 0.5; }
  .pulse-area {
    fill: url(#areaGradient);
    animation: fade-in 1.5s ease-out forwards;
    opacity: 0;
    animation-delay: 0.5s;
  }
  .pulse-line { 
    stroke: ${accent}; 
    stroke-width: 2.5; 
    stroke-linecap: round; 
    stroke-linejoin: round; 
    fill: none; 
    filter: url(#glow);
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 2s ease-out forwards;
  }
  @keyframes draw {
    from { stroke-dashoffset: 1; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pulse-line { animation: none !important; stroke-dashoffset: 0; }
    .pulse-area { animation: none !important; opacity: 1; }
    .pulse-dot animate { display: none; }
  }
  </style>

  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="aurora-blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="30" />
    </filter>
    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.0" />
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bg}" />

  <ellipse cx="${width / 2}" cy="${height / 2 + 10}" rx="${width / 4}" ry="30" fill="${accent}" opacity="0.12" filter="url(#aurora-blur)" />

  <line x1="${paddingX}" y1="${paddingYTop}" x2="${width - paddingX}" y2="${paddingYTop}" stroke="${text}" stroke-width="0.75" stroke-opacity="0.05" />
  <line x1="${paddingX}" y1="${paddingYTop + graphHeight}" x2="${width - paddingX}" y2="${paddingYTop + graphHeight}" stroke="${text}" stroke-width="0.75" stroke-opacity="0.05" />

  ${!params.hide_title ? `<text x="30" y="38" class="title" font-size="${getUsernameFontSize(truncateUsername(safeUser))}" style="font-size: ${getUsernameFontSize(truncateUsername(safeUser))}px;">${truncateUsername(safeUser).toUpperCase()}${params.isOfflineFallback ? '<tspan fill="#ff9f43" font-size="10px" font-weight="bold"> [STALE CACHE]</tspan>' : ''}</text>` : ''}
  ${
    !params.hide_stats
      ? `
  <text x="${width - 30}" y="42" text-anchor="end" class="stats">${pulseTotal} ${params.mode === 'loc' ? 'LINES (EST.)' : 'COMMITS'}</text>
  <text x="${width - 30}" y="58" text-anchor="end" class="label">LAST 30 DAYS</text>
  `
      : ''
  }

  <path class="pulse-area" d="${areaPathD}" />
  <path class="pulse-line" d="${pathD}" pathLength="1" />

  <g class="pulse-dot">
    <circle cx="${lastX}" cy="${lastY}" r="7" fill="${accent}" opacity="0.4">
      <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="${lastX}" cy="${lastY}" r="3.5" fill="#ffffff" stroke="${accent}" stroke-width="1.5" />
  </g>
</svg>
`;
}
function generateAutoThemePulseSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  const light = AUTO_THEME_LIGHT;
  const dark = AUTO_THEME_DARK;
  const safeUser = escapeXML(params.user || 'GitHub User');

  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const isPredefinedFont = isBundledFont(sanitizedFont);

  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50));

  const googleFontUrlPart =
    sanitizedFont && !isPredefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const width = params.width || 800;
  const height = params.height || 170;

  const days: number[] = [];
  calendar.weeks.forEach((week) => {
    week.contributionDays.forEach((day) => {
      days.push(
        params.mode === 'loc'
          ? (day.locAdditions || 0) + (day.locDeletions || 0)
          : day.contributionCount
      );
    });
  });

  const pulseDays = days.slice(-30);
  const pulseTotal = pulseDays.reduce((sum, count) => sum + count, 0);

  const maxCount = Math.max(...pulseDays, 1);
  const minCount = Math.min(...pulseDays);
  const range = maxCount - minCount || 1;

  const paddingX = 40;
  const paddingYTop = 80;
  const paddingYBottom = 30;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingYTop - paddingYBottom;

  const stepX = graphWidth / Math.max(pulseDays.length - 1, 1);

  let pathD = '';
  pulseDays.forEach((count, i) => {
    const x = paddingX + i * stepX;
    const normalized = (count - minCount) / range;
    const y = paddingYTop + graphHeight - normalized * graphHeight;

    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      const prevCount = pulseDays[i - 1];
      const prevNormalized = (prevCount - minCount) / range;
      const prevX = paddingX + (i - 1) * stepX;
      const prevY = paddingYTop + graphHeight - prevNormalized * graphHeight;

      const cp1X = prevX + stepX / 2;
      const cp1Y = prevY;
      const cp2X = x - stepX / 2;
      const cp2Y = y;

      pathD += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${x} ${y}`;
    }
  });

  const bottomY = paddingYTop + graphHeight;
  const lastX = paddingX + (pulseDays.length - 1) * stepX;
  const firstX = paddingX;
  const areaPathD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  const lastCount = pulseDays[pulseDays.length - 1] ?? 0;
  const lastNormalized = (lastCount - minCount) / range;
  const lastY = paddingYTop + graphHeight - lastNormalized * graphHeight;

  const safeId = safeUser.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  fill="none"
  role="img"
  aria-labelledby="cp-title-${safeId}"
  aria-describedby="cp-desc-${safeId}"
>
  <title id="cp-title-${safeId}">Heartbeat Sparkline for ${safeUser}</title>
  <desc id="cp-desc-${safeId}">Heartbeat sparkline for ${safeUser} showing commit activity over the last 30 days (total commits: ${pulseTotal}).</desc>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}

  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; } }
  .cp-bg-fill { fill: var(--cp-bg); } 

  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: var(--cp-text); font-size: 16px; letter-spacing: 2px; font-weight: 700; opacity: 0.9; }
  .stats { font-family: ${statsFont}; fill: var(--cp-accent); font-size: 28px; font-weight: 600; letter-spacing: 0; }
  .label { font-family: "Roboto", sans-serif; fill: var(--cp-text); font-size: 10px; font-weight: 500; letter-spacing: 1.5px; opacity: 0.5; }
  .pulse-area {
    fill: url(#areaGradient);
    animation: fade-in 1.5s ease-out forwards;
    opacity: 0;
    animation-delay: 0.5s;
  }
  .pulse-line { 
    stroke: var(--cp-accent); 
    stroke-width: 2.5; 
    stroke-linecap: round; 
    stroke-linejoin: round; 
    fill: none; 
    filter: url(#glow);
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 2s ease-out forwards;
  }
  @keyframes draw {
    from { stroke-dashoffset: 1; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pulse-line { animation: none !important; stroke-dashoffset: 0; }
    .pulse-area { animation: none !important; opacity: 1; }
    .pulse-dot animate { display: none; }
  }
  </style>

  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="aurora-blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="30" />
    </filter>
    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--cp-accent)" stop-opacity="0.25" />
      <stop offset="100%" stop-color="var(--cp-accent)" stop-opacity="0.0" />
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" rx="${radius}" class="${params.hideBackground ? '' : 'cp-bg-fill'}" fill="${params.hideBackground ? 'transparent' : ''}" />

  <ellipse cx="${width / 2}" cy="${height / 2 + 10}" rx="${width / 4}" ry="30" fill="var(--cp-accent)" opacity="0.12" filter="url(#aurora-blur)" />

  <line x1="${paddingX}" y1="${paddingYTop}" x2="${width - paddingX}" y2="${paddingYTop}" stroke="var(--cp-text)" stroke-width="0.75" stroke-opacity="0.05" />
  <line x1="${paddingX}" y1="${paddingYTop + graphHeight}" x2="${width - paddingX}" y2="${paddingYTop + graphHeight}" stroke="var(--cp-text)" stroke-width="0.75" stroke-opacity="0.05" />

  ${!params.hide_title ? `<text x="30" y="38" class="title" font-size="${getUsernameFontSize(truncateUsername(safeUser))}" style="font-size: ${getUsernameFontSize(truncateUsername(safeUser))}px;">${truncateUsername(safeUser).toUpperCase()}${params.isOfflineFallback ? '<tspan fill="#ff9f43" font-size="10px" font-weight="bold"> [STALE CACHE]</tspan>' : ''}</text>` : ''}
  ${
    !params.hide_stats
      ? `
  <text x="${width - 30}" y="42" text-anchor="end" class="stats">${pulseTotal} ${params.mode === 'loc' ? 'LINES (EST.)' : 'COMMITS'}</text>
  <text x="${width - 30}" y="58" text-anchor="end" class="label">LAST 30 DAYS</text>
  `
      : ''
  }

  <path class="pulse-area" d="${areaPathD}" />
  <path class="pulse-line" d="${pathD}" pathLength="1" />

  <g class="pulse-dot">
    <circle cx="${lastX}" cy="${lastY}" r="7" fill="var(--cp-accent)" opacity="0.4">
      <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="${lastX}" cy="${lastY}" r="3.5" fill="#ffffff" stroke="var(--cp-accent)" stroke-width="1.5" />
  </g>
</svg>
`;
}

export function generateSkylineSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  if (params.autoTheme) {
    return generateAutoThemeSkylineSVG(stats, params, calendar);
  }
  return renderSkylineSVG(stats, params, calendar, false);
}

export function generateAutoThemeSkylineSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  return renderSkylineSVG(stats, params, calendar, true);
}

function renderSkylineSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar,
  isAutoTheme: boolean
): string {
  const safeUser = escapeXML(params.user || 'GitHub User');
  const light = AUTO_THEME_LIGHT;
  const dark = AUTO_THEME_DARK;

  const bg = isAutoTheme ? '' : `#${sanitizeHexColor(params.bg, '0d1117')}`;
  const rawAccent = Array.isArray(params.accent)
    ? params.accent[params.accent.length - 1]
    : params.accent;
  const accent = isAutoTheme ? '' : `#${sanitizeHexColor(rawAccent, '00ffaa')}`;
  const text = isAutoTheme ? '' : `#${sanitizeHexColor(params.text, 'ffffff')}`;

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

  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50));

  const width = params.width || 800;
  const height = params.height || 260;

  const weeklyContributions: number[] = [];
  const weeks = calendar.weeks;
  weeks.forEach((week) => {
    let count = 0;
    week.contributionDays.forEach((day) => {
      count +=
        params.mode === 'loc'
          ? (day.locAdditions || 0) + (day.locDeletions || 0)
          : day.contributionCount;
    });
    weeklyContributions.push(count);
  });

  const totalContributions = weeklyContributions.reduce((sum, c) => sum + c, 0);
  const maxWeeklyCount = Math.max(...weeklyContributions, 1);

  const paddingX = 40;
  const paddingYTop = 80;
  const paddingYBottom = 40;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingYTop - paddingYBottom;
  const bottomY = paddingYTop + graphHeight;

  const numWeeks = weeklyContributions.length || 1;
  const stepX = graphWidth / Math.max(numWeeks - 1, 1);
  const buildingWidth = Math.max(2, Math.floor(stepX - 3));

  let buildingsSVG = '';
  const animate = params.animate ?? true;

  const accentList = Array.isArray(params.accent)
    ? params.accent.map((c) => `#${sanitizeHexColor(c, '00ffaa')}`)
    : [accent];

  weeklyContributions.forEach((count, i) => {
    const x = paddingX + i * stepX;

    let normalized = 0;
    if (count > 0) {
      if (params.scale === 'log') {
        const logMax = Math.log2(maxWeeklyCount + 1) || 1;
        normalized = Math.log2(count + 1) / logMax;
      } else {
        normalized = count / maxWeeklyCount;
      }
    }

    let h = normalized * graphHeight;
    if (count > 0 && h < 6) {
      h = 6;
    }
    if (count === 0) {
      h = 1.5;
    }

    const y = bottomY - h;
    const delay = (i * 0.015).toFixed(3);

    let buildingColor = '';
    let opacity = 0.8;
    if (isAutoTheme) {
      buildingColor = 'var(--cp-accent)';
      opacity = count === 0 ? 0.15 : 0.7;
    } else {
      if (count === 0) {
        buildingColor = accentList[0];
        opacity = 0.15;
      } else if (accentList.length > 1) {
        const ratio = count / maxWeeklyCount;
        let colorIdx = 0;
        if (ratio <= 0.25) colorIdx = 0;
        else if (ratio <= 0.5) colorIdx = 1;
        else if (ratio <= 0.75) colorIdx = 2;
        else colorIdx = 3;
        buildingColor = accentList[Math.min(colorIdx, accentList.length - 1)];
        opacity = 0.8;
      } else {
        buildingColor = accent;
        opacity = 0.8;
      }
    }

    let windowsSVG = '';
    const canHaveWindows = count > 0 && h >= 22 && buildingWidth >= 5;
    if (canHaveWindows) {
      const windowW = 2;
      const windowH = 3;
      const topPadding = 6;
      const bottomPadding = 4;
      const stepYOffset = 8;

      const numCols = buildingWidth >= 8 ? 2 : 1;
      const startX =
        numCols === 2
          ? [
              x + (buildingWidth - windowW * 2 - 2) / 2,
              x + (buildingWidth - windowW * 2 - 2) / 2 + windowW + 2,
            ]
          : [x + (buildingWidth - windowW) / 2];

      const numRows = Math.floor((h - topPadding - bottomPadding) / stepYOffset);
      const windowDelay = (parseFloat(delay) + 0.8).toFixed(3);

      for (let r = 0; r < numRows; r++) {
        const windowY = y + topPadding + r * stepYOffset;
        for (let c = 0; c < numCols; c++) {
          const winSeed = `${i}:${r}:${c}`;
          const isLit = deterministicRandom(winSeed) < 0.35;
          if (isLit) {
            const winFill = isAutoTheme ? 'var(--cp-text)' : '#ffffff';
            if (animate) {
              windowsSVG += `
                <rect class="cp-window cp-window-animated" style="animation-delay: ${windowDelay}s;" x="${startX[c].toFixed(1)}" y="${windowY.toFixed(1)}" width="${windowW}" height="${windowH}" fill="${winFill}" opacity="0" pointer-events="none" />
              `;
            } else {
              windowsSVG += `
                <rect class="cp-window" x="${startX[c].toFixed(1)}" y="${windowY.toFixed(1)}" width="${windowW}" height="${windowH}" fill="${winFill}" opacity="0.85" pointer-events="none" />
              `;
            }
          }
        }
      }
    }

    const dateStr = weeks[i]?.contributionDays[0]?.date || '';
    const unit = params.mode === 'loc' ? 'lines' : 'commits';
    const tooltipText = `${dateStr} week: ${count} ${unit}`;

    let rectSVG = '';
    const rectClass = `cp-building${animate ? ' cp-building-animated' : ''}`;
    const rectStyle = animate ? ` style="animation-delay: ${delay}s;"` : '';

    if (isAutoTheme) {
      rectSVG = `<rect class="${rectClass}"${rectStyle} x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${buildingWidth}" height="${h.toFixed(1)}" fill="var(--cp-accent)" fill-opacity="${opacity}" rx="1" />`;
    } else {
      rectSVG = `<rect class="${rectClass}"${rectStyle} x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${buildingWidth}" height="${h.toFixed(1)}" fill="${buildingColor}" fill-opacity="${opacity}" rx="1" />`;
    }

    buildingsSVG += `
      <g>
        <title>${escapeXML(tooltipText)}</title>
        ${rectSVG}
        ${windowsSVG}
      </g>
    `;
  });

  let starsSVG = '';
  const numStars = 25;
  for (let sIdx = 0; sIdx < numStars; sIdx++) {
    const seedX = `star:${sIdx}:x`;
    const seedY = `star:${sIdx}:y`;
    const seedR = `star:${sIdx}:r`;
    const starX = paddingX + deterministicRandom(seedX) * graphWidth;
    const starY = paddingYTop - 30 + deterministicRandom(seedY) * (graphHeight * 0.75);
    const starR = 0.5 + deterministicRandom(seedR) * 0.8;
    const seedO = `star:${sIdx}:o`;
    const starOpacity = 0.2 + deterministicRandom(seedO) * 0.6;
    const starFill = isAutoTheme ? 'var(--cp-text)' : '#ffffff';

    let starAnim = '';
    if (animate) {
      const delay = (deterministicRandom(seedX) * 3).toFixed(2);
      const dur = (2 + deterministicRandom(seedY) * 3).toFixed(2);
      starAnim = `style="animation: twinkle ${dur}s ease-in-out infinite; animation-delay: ${delay}s;"`;
    }

    starsSVG += `<circle class="cp-star" cx="${starX.toFixed(1)}" cy="${starY.toFixed(1)}" r="${starR.toFixed(1)}" fill="${starFill}" opacity="${starOpacity.toFixed(2)}" ${starAnim} pointer-events="none" />`;
  }

  const styleBg = isAutoTheme ? 'var(--cp-bg)' : bg;

  const labels = getLabels(params.lang);
  const modeLabel = params.mode === 'loc' ? 'TOTAL LINES OF CODE' : labels.ANNUAL_SYNC_TOTAL;

  let defs = '';
  if (isAutoTheme) {
    defs = `
      <defs>
        <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--cp-bg)" stop-opacity="0" />
          <stop offset="100%" stop-color="var(--cp-accent)" stop-opacity="0.12" />
        </linearGradient>
        <filter id="horizonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    `;
  } else {
    defs = `
      <defs>
        <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bg}" stop-opacity="0" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0.12" />
        </linearGradient>
        <filter id="horizonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    `;
  }

  const strokeStroke = isAutoTheme ? 'var(--cp-accent)' : accent;
  const groundLine = `
    <line x1="${paddingX}" y1="${bottomY}" x2="${width - paddingX}" y2="${bottomY}" stroke="${strokeStroke}" stroke-width="1.5" stroke-opacity="0.6" filter="url(#horizonGlow)" />
  `;

  const upperUser = escapeXML((params.user || 'GitHub User').toUpperCase());

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  fill="none"
  role="img"
  aria-labelledby="skyline-title skyline-desc"
>
  <title id="skyline-title">${upperUser}'s CommitPulse Skyline</title>
  <desc id="skyline-desc">A panoramic city skyline visualization of ${upperUser}'s GitHub contributions</desc>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}

  ${
    isAutoTheme
      ? `
  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; } }
  .cp-bg-fill { fill: var(--cp-bg); }
  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: var(--cp-text); font-size: 16px; letter-spacing: 2px; font-weight: 700; opacity: 0.9; text-transform: uppercase; }
  .stats { font-family: ${statsFont}; fill: var(--cp-accent); font-size: 26px; font-weight: 600; letter-spacing: 0; }
  .label { font-family: "Roboto", sans-serif; fill: var(--cp-text); font-size: 10px; font-weight: 500; letter-spacing: 0.5px; opacity: 0.5; }
  .label-end { text-anchor: end; }
  .stats-end { text-anchor: end; }
  `
      : `
  .title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: ${text}; font-size: 16px; letter-spacing: 2px; font-weight: 700; opacity: 0.9; text-transform: uppercase; }
  .stats { font-family: ${statsFont}; fill: ${accent}; font-size: 26px; font-weight: 600; letter-spacing: 0; }
  .label { font-family: "Roboto", sans-serif; fill: ${text}; font-size: 10px; font-weight: 500; letter-spacing: 0.5px; opacity: 0.5; }
  .label-end { text-anchor: end; }
  .stats-end { text-anchor: end; }
  `
  }

  @keyframes twinkle {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.8; }
  }

  .cp-building {
    transition: fill-opacity 0.2s ease;
    transform-origin: 0px ${bottomY}px;
    transform: scaleY(1);
  }
  .cp-building:hover {
    fill-opacity: 1.0 !important;
  }
  .cp-building-animated {
    transform: scaleY(0);
    animation: skyline-rise 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .cp-window-animated {
    opacity: 0;
    animation: window-fade 0.6s ease-out forwards;
  }
  @keyframes skyline-rise {
    to { transform: scaleY(1); }
  }
  @keyframes window-fade {
    to { opacity: 0.85; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cp-star { animation: none !important; }
    .cp-building-animated { transform: scaleY(1) !important; animation: none !important; }
    .cp-window-animated { opacity: 0.85 !important; animation: none !important; }
  }
  </style>

  ${defs}

  <rect width="${width}" height="${height}" rx="${radius}" class="${isAutoTheme && !params.hideBackground ? 'cp-bg-fill' : ''}" fill="${params.hideBackground ? 'transparent' : styleBg}" />

  <rect x="${paddingX}" y="${paddingYTop - 20}" width="${graphWidth}" height="${graphHeight + 20}" fill="url(#skyGradient)" />

  <g class="cp-stars">${starsSVG}</g>

  <g class="cp-skyline">${buildingsSVG}</g>

  ${groundLine}

  ${!params.hide_title ? `<text x="30" y="38" class="title" font-size="${getUsernameFontSize(truncateUsername(safeUser))}" style="font-size: ${getUsernameFontSize(truncateUsername(safeUser))}px;">${truncateUsername(safeUser)}</text>` : ''}
  ${
    !params.hide_stats
      ? `
      <g transform="translate(${width - 330}, 24)">
        <g transform="translate(0, 0)">
          <text class="label">${modeLabel}</text>
          <text y="34" class="stats">${totalContributions}</text>
        </g>
        <g transform="translate(300, 0)">
          <text class="label label-end">${labels.CURRENT_STREAK}</text>
          <text y="34" class="stats stats-end">${stats.currentStreak}d</text>
        </g>
      </g>
      `
      : ''
  }
</svg>
`;
}

export function generateRateLimitSVG(
  bg: string,
  accent: string,
  text: string,
  radius: number,
  speed: string = '8s',
  isCircuitOpen = false
): string {
  const safeSpeed = sanitizeSpeed(speed);
  const ghostTowersHtml = renderGhostTowers(GHOST_LAYOUT, accent);

  const safeId = 'rate_limit';
  const subtitle = isCircuitOpen ? 'CIRCUIT BREAKER' : 'RATE LIMITED';
  const subtitleWidth = isCircuitOpen ? 220 : 180;
  const subtitleRectX = 300 - subtitleWidth / 2;
  const note = isCircuitOpen
    ? 'Circuit breaker active. System is temporarily offline.'
    : 'Please wait a moment before trying again';

  return `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="100%"
  viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}"
  fill="none"
  role="img"
  aria-labelledby="cp-title-${safeId}"
  aria-describedby="cp-desc-${safeId}"
>
  <title id="cp-title-${safeId}">Rate Limit Exceeded</title>
  <desc id="cp-desc-${safeId}">GitHub API rate limit exceeded. Please try again later.</desc>
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="softglow" x="-80%" y="-80%" width="360%" height="360%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
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
    @media (prefers-reduced-motion: reduce) {
      .ghost-pulse { animation: none; }
      .rate-limit-scan animate { display: none; }
    }
  </style>

  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="${radius}" fill="${bg}"/>

  <g transform="translate(0, 20)" class="ghost-pulse">
    ${ghostTowersHtml}
  </g>

  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="${radius}" fill="url(#ghostFade)"/>

  <rect x="100" y="80" width="400" height="1" fill="${accent}" fill-opacity="0.12" class="rate-limit-scan">
    <animate attributeName="y" values="80;320;80" dur="${safeSpeed}" repeatCount="indefinite"/>
  </rect>

  <text x="300" y="50" text-anchor="middle" class="title">API RATE LIMIT</text>

  <rect x="180" y="62" width="240" height="1" fill="${accent}" fill-opacity="0.15"/>

  <circle cx="300" cy="190" r="32" fill="none"
    stroke="${accent}" stroke-width="1.2" stroke-opacity="0.3" filter="url(#softglow)"/>
  <path d="M300 172 V200 M300 210 V210.1"
    stroke="${accent}" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.6"/>

  <rect x="${subtitleRectX}" y="235" width="${subtitleWidth}" height="22" rx="4"
    fill="${accent}" fill-opacity="0.08"
    stroke="${accent}" stroke-width="0.8" stroke-opacity="0.25"/>
  <text x="300" y="250" text-anchor="middle"
    font-family="Syncopate, sans-serif" font-size="9" font-weight="700"
    fill="${accent}" opacity="0.7" letter-spacing="4">${subtitle}</text>

  <text x="300" y="278" text-anchor="middle"
    font-family="Space Grotesk, sans-serif" font-size="11"
    fill="${text}" opacity="0.3">
    ${note}
  </text>

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

export function generateLanguagesSVG(
  stats: StreakStats,
  params: BadgeParams,
  repoContributions: RepoContribution[]
): string {
  const safeUser = escapeXML(params.user || 'GitHub User');
  const bg = `#${sanitizeHexColor(params.bg, '0d1117')}`;

  const accentRaw = Array.isArray(params.accent)
    ? params.accent[params.accent.length - 1]
    : params.accent;
  const accentStr = accentRaw || '00ffaa';
  const accent = `#${sanitizeHexColor(accentStr, '00ffaa')}`;

  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;
  const borderAttr = params.border
    ? `stroke="#${sanitizeHexColor(params.border, '000000')}" stroke-width="2"`
    : '';

  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const isPredefinedFont = isBundledFont(sanitizedFont);
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
  const safeId = safeUser.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();

  const langCounts: Record<string, number> = {};
  repoContributions.forEach((c) => {
    const l = c.repository.primaryLanguage?.name;
    if (l) langCounts[l] = (langCounts[l] || 0) + c.contributions.totalCount;
  });

  const total = Object.values(langCounts).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-labelledby="cp-title-${safeId}">
  ${renderHeader(safeUser, stats, sf, params, safeId)}
  ${renderStyle(selectedFont, statsFont, googleFontsImport, text, accent, sf, bg, params.entrance || 'rise')}
  <rect width="${W}" height="${H}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bg}" ${borderAttr} />
  <text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-family='${statsFont}' font-size="${16 * sf}px" fill="${text}" opacity="0.6">No language data available in the selected period.</text>
  ${renderFooter(stats, params, labels, safeUser, accent, sf)}
</svg>`;
  }

  const languages = Object.entries(langCounts)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / total) * 100),
      color: (LANGUAGE_COLORS as Record<string, string>)[name] ?? '#8B949E',
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  const TOWER_SCALE = 2.5;
  const V_SHAPE_COORDS = [
    { x: 0, y: 0, zIndex: 3 },
    { x: -80, y: -45, zIndex: 2 },
    { x: 80, y: -45, zIndex: 2 },
    { x: -160, y: -90, zIndex: 1 },
    { x: 160, y: -90, zIndex: 1 },
  ];

  let towersHtml = '';
  const maxPercent = languages[0]?.percentage || 100;

  const sortedLanguages = languages
    .map((lang, idx) => ({
      ...lang,
      coord: V_SHAPE_COORDS[idx],
    }))
    .sort((a, b) => a.coord.zIndex - b.coord.zIndex);

  sortedLanguages.forEach((lang, idx) => {
    const scaledX = W / 2 + lang.coord.x * sf;
    const scaledY = H / 2 + (50 + lang.coord.y) * sf;
    const h = Math.max(30, (lang.percentage / maxPercent) * 140) * sf;

    const towerScale = TOWER_SCALE * sf;
    const paths = buildTowerPaths(h, towerScale);

    const hexColor = lang.color.startsWith('#') ? lang.color : `#${lang.color}`;
    const delay = (idx * 0.15).toFixed(3);
    const tooltip = `${lang.name}: ${lang.percentage}%`;

    towersHtml += `
        <g transform="translate(${scaledX}, ${scaledY})">
          <g class="cp-tower interactive-tower" style="animation-delay: ${delay}s;">
            <title>${escapeXML(tooltip)}</title>
            <path d="${paths.left}" fill="${hexColor}" fill-opacity="0.85" />
            <path d="${paths.right}" fill="${hexColor}" fill-opacity="0.65" />
            <path d="${paths.top}" fill="${hexColor}" fill-opacity="1.0" />
            
            <text x="0" y="${-h - 18 * sf}" text-anchor="middle" font-family='${statsFont}' font-size="${14 * sf}px" fill="${text}" font-weight="bold">${lang.name}</text>
            <text x="0" y="${-h - 4 * sf}" text-anchor="middle" font-family='${statsFont}' font-size="${12 * sf}px" fill="${text}" opacity="0.6">${lang.percentage}%</text>
          </g>
        </g>`;
  });

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-labelledby="cp-title-${safeId}" aria-describedby="cp-desc-${safeId}">
  ${renderHeader(safeUser, stats, sf, params, safeId)}
  ${renderStyle(selectedFont, statsFont, googleFontsImport, text, accent, sf, bg, params.entrance || 'rise')}
  <rect width="${W}" height="${H}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bg}" ${borderAttr} />
  
  <g id="cp-towers" style="transform-origin: center; transform-box: fill-box;">
    ${towersHtml}
  </g>
  
  ${renderFooter(stats, params, labels, safeUser, accent, sf)}
</svg>`;
}

// ─── Activity Graph View ───────────────────────────────────────────────────

export function generateActivityGraphSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  if (params.autoTheme) return generateAutoThemeActivityGraphSVG(stats, params, calendar);

  const safeUser = escapeXML(params.user || 'GitHub User');
  const bg = `#${sanitizeHexColor(params.bg, '0d1117')}`;
  const bgFill =
    params.bgType === 'linear' || params.bgType === 'radial' ? 'url(#canvas-gradient)' : bg;

  const rawAccent = Array.isArray(params.accent)
    ? params.accent[params.accent.length - 1]
    : params.accent;
  const accent = `#${sanitizeHexColor(rawAccent, '00ffaa')}`;
  const text = `#${sanitizeHexColor(params.text, 'ffffff')}`;

  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const isPredefinedFont = isBundledFont(sanitizedFont);
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const googleFontUrlPart =
    sanitizedFont && !isPredefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50));

  const width = params.width || 800;
  const height = params.height || 220;

  const { pathD, areaPathD, trendPathD, peakX, peakY, peakCount, peakDate, days, totalCount } =
    _buildActivityGraphData(calendar, params, width, height);

  const safeId = safeUser.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();
  const unit = params.mode === 'loc' ? 'LINES (EST.)' : 'COMMITS';

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  fill="none"
  role="img"
  aria-labelledby="cp-title-${safeId}"
  aria-describedby="cp-desc-${safeId}"
>
  <title id="cp-title-${safeId}">Activity Graph for ${safeUser}</title>
  <desc id="cp-desc-${safeId}">Contribution activity graph for ${safeUser} over ${days} days, totalling ${totalCount} ${unit.toLowerCase()}.</desc>
  &lt;!--_renderActivityGraphDefs(accent, bg, params)--&gt;
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}
  &lt;!--_activityGraphCSS(selectedFont, statsFont, text, accent, false)--&gt;
  </style>
  <rect width="${width}" height="${height}" rx="${radius}" fill="${params.hideBackground ? 'transparent' : bgFill}" />
  <path class="ag-area" d="${areaPathD}" />
  <path class="ag-trend" d="${trendPathD}" stroke="${accent}" />
  <path class="ag-line" d="${pathD}" stroke="${accent}" />
  &lt;!--_renderPeakAnnotation(peakX, peakY, peakCount, peakDate, accent, text, statsFont, false)--&gt;
  ${!params.hide_title ? `<text x="24" y="28" class="ag-title">${safeUser.toUpperCase()}${params.isOfflineFallback ? '<tspan fill="#ff9f43" font-size="10px" font-weight="bold"> [STALE CACHE]</tspan>' : ''}</text>` : ''}
  ${!params.hide_stats ? `<text x="${width - 24}" y="28" text-anchor="end" class="ag-total">${totalCount} ${unit}</text>` : ''}
</svg>
`;
}

function generateAutoThemeActivityGraphSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
): string {
  const light = AUTO_THEME_LIGHT;
  const dark = AUTO_THEME_DARK;
  const safeUser = escapeXML(params.user || 'GitHub User');

  const sanitizedFont = sanitizeFont(params.font);
  const selectedFont = resolveFont(sanitizedFont);
  const isPredefinedFont = isBundledFont(sanitizedFont);
  const statsFont = selectedFont || '"Space Grotesk", sans-serif';
  const googleFontUrlPart =
    sanitizedFont && !isPredefinedFont ? sanitizeGoogleFontUrl(sanitizedFont) : null;
  const googleFontsImport = googleFontUrlPart
    ? `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrlPart}&amp;display=swap');`
    : '';

  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50));

  const width = params.width || 800;
  const height = params.height || 220;

  const { pathD, areaPathD, trendPathD, peakX, peakY, peakCount, peakDate, days, totalCount } =
    _buildActivityGraphData(calendar, params, width, height);

  const safeId = safeUser.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();
  const unit = params.mode === 'loc' ? 'LINES (EST.)' : 'COMMITS';

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  fill="none"
  role="img"
  aria-labelledby="cp-title-${safeId}"
  aria-describedby="cp-desc-${safeId}"
>
  <title id="cp-title-${safeId}">Activity Graph for ${safeUser}</title>
  <desc id="cp-desc-${safeId}">Contribution activity graph for ${safeUser} over ${days} days, totalling ${totalCount} ${unit.toLowerCase()}.</desc>
  <defs>
    <linearGradient id="ag-area-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--cp-accent)" stop-opacity="0.35" />
      <stop offset="100%" stop-color="var(--cp-accent)" stop-opacity="0.0" />
    </linearGradient>
    <filter id="ag-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap');
  ${googleFontsImport}
  :root { --cp-bg: #${light.bg}; --cp-text: #${light.text}; --cp-accent: #${light.accent}; }
  @media (prefers-color-scheme: dark) { :root { --cp-bg: #${dark.bg}; --cp-text: #${dark.text}; --cp-accent: #${dark.accent}; } }
  .cp-bg-fill { fill: var(--cp-bg); }
  &lt;!--_activityGraphCSS(selectedFont, statsFont, 'var(--cp-text)', 'var(--cp-accent)', true)--&gt;
  </style>
  <rect width="${width}" height="${height}" rx="${radius}" ${params.hideBackground ? 'fill="transparent"' : 'class="cp-bg-fill"'} />
  <path class="ag-area" d="${areaPathD}" />
  <path class="ag-trend" d="${trendPathD}" stroke="var(--cp-accent)" />
  <path class="ag-line" d="${pathD}" stroke="var(--cp-accent)" />
  &lt;!--_renderPeakAnnotation(peakX, peakY, peakCount, peakDate, 'var(--cp-accent)', 'var(--cp-text)', statsFont, true)--&gt;
  ${!params.hide_title ? `<text x="24" y="28" class="ag-title">${safeUser.toUpperCase()}${params.isOfflineFallback ? '<tspan fill="#ff9f43" font-size="10px" font-weight="bold"> [STALE CACHE]</tspan>' : ''}</text>` : ''}
  ${!params.hide_stats ? `<text x="${width - 24}" y="28" text-anchor="end" class="ag-total">${totalCount} ${unit}</text>` : ''}
</svg>
`;
}

interface ActivityGraphData {
  pathD: string;
  areaPathD: string;
  trendPathD: string;
  peakX: number;
  peakY: number;
  peakCount: number;
  peakDate: string;
  days: number;
  totalCount: number;
}

function _buildActivityGraphData(
  calendar: ContributionCalendar,
  params: BadgeParams,
  width: number,
  height: number
): ActivityGraphData {
  // Flatten all days from the calendar (already filtered to from/to by API)
  const allDays = calendar.weeks.flatMap((w) => w.contributionDays);

  // Deduplicate by date, preserving order
  const seen = new Set<string>();
  const uniqueDays = allDays.filter((d) => {
    if (!d || seen.has(d.date)) return false;
    seen.add(d.date);
    return true;
  });

  const counts = uniqueDays.map((d) =>
    params.mode === 'loc' ? (d.locAdditions || 0) + (d.locDeletions || 0) : d.contributionCount
  );

  const totalCount = counts.reduce((s, c) => s + c, 0);
  const n = counts.length;

  const paddingX = 40;
  const paddingYTop = 46;
  const paddingYBottom = 24;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingYTop - paddingYBottom;
  const bottomY = paddingYTop + graphHeight;

  const maxCount = Math.max(...counts, 1);
  const minCount = Math.min(...counts);
  const range = maxCount - minCount || 1;

  const stepX = n > 1 ? graphWidth / (n - 1) : graphWidth;

  // Point coordinates
  const pts = counts.map((c, i) => {
    const x = paddingX + i * stepX;
    const normalized = (c - minCount) / range;
    const y = paddingYTop + graphHeight - normalized * graphHeight;
    return { x, y, c, date: uniqueDays[i]?.date ?? '' };
  });

  // Smooth cubic bezier area chart path
  let pathD = '';
  pts.forEach((pt, i) => {
    if (i === 0) {
      pathD += `M ${pt.x} ${pt.y}`;
    } else {
      const prev = pts[i - 1];
      const cp1x = prev.x + stepX / 2;
      const cp2x = pt.x - stepX / 2;
      pathD += ` C ${cp1x} ${prev.y}, ${cp2x} ${pt.y}, ${pt.x} ${pt.y}`;
    }
  });

  const lastPt = pts[pts.length - 1] ?? { x: paddingX, y: bottomY };
  const firstPt = pts[0] ?? { x: paddingX, y: bottomY };
  const areaPathD = n > 0 ? `${pathD} L ${lastPt.x} ${bottomY} L ${firstPt.x} ${bottomY} Z` : '';

  // Linear trend line (least-squares regression)
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;
  pts.forEach(({ x, y }) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });
  const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
  const intercept = n > 0 ? (sumY - slope * sumX) / n : paddingYTop + graphHeight / 2;
  const trendY1 = slope * firstPt.x + intercept;
  const trendY2 = slope * lastPt.x + intercept;
  const trendPathD = n > 1 ? `M ${firstPt.x} ${trendY1} L ${lastPt.x} ${trendY2}` : '';

  // Peak point
  let peakIdx = 0;
  counts.forEach((c, i) => {
    if (c > counts[peakIdx]) peakIdx = i;
  });
  const peakPt = pts[peakIdx] ?? { x: paddingX, y: paddingYTop, date: '' };

  return {
    pathD,
    areaPathD,
    trendPathD,
    peakX: peakPt.x,
    peakY: peakPt.y,
    peakCount: counts[peakIdx] ?? 0,
    peakDate: peakPt.date,
    days: n,
    totalCount,
  };
}

function _renderActivityGraphDefs(accent: string, bg: string, params: BadgeParams): string {
  const bgFill =
    params.bgType === 'linear' || params.bgType === 'radial' ? 'url(#canvas-gradient)' : bg;

  let canvasGradient = '';
  if (params.bgType === 'linear' || params.bgType === 'radial') {
    const bgStart = params.bgStart
      ? params.bgStart.startsWith('#')
        ? params.bgStart
        : `#${params.bgStart}`
      : '#0d1117';
    const bgEnd = params.bgEnd
      ? params.bgEnd.startsWith('#')
        ? params.bgEnd
        : `#${params.bgEnd}`
      : '#000000';
    if (params.bgType === 'linear') {
      const angle = params.bgAngle ?? 90;
      const angleRad = (angle - 90) * (Math.PI / 180);
      const x1 = Math.round(50 + Math.cos(angleRad + Math.PI) * 50) + '%';
      const y1 = Math.round(50 + Math.sin(angleRad + Math.PI) * 50) + '%';
      const x2 = Math.round(50 + Math.cos(angleRad) * 50) + '%';
      const y2 = Math.round(50 + Math.sin(angleRad) * 50) + '%';
      canvasGradient = `<linearGradient id="canvas-gradient" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </linearGradient>`;
    } else {
      canvasGradient = `<radialGradient id="canvas-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </radialGradient>`;
    }
  }

  return `<defs>
    <linearGradient id="ag-area-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.0" />
    </linearGradient>
    <filter id="ag-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    ${canvasGradient}
  </defs>`;
}

function _activityGraphCSS(
  selectedFont: string | null,
  statsFont: string,
  text: string,
  accent: string,
  isAutoTheme: boolean
): string {
  const areaFill = isAutoTheme ? 'url(#ag-area-grad)' : 'url(#ag-area-grad)';
  return `
  .ag-title { font-family: ${selectedFont || '"Syncopate", sans-serif'}; fill: ${text}; font-size: 13px; letter-spacing: 3px; font-weight: 700; opacity: 0.85; }
  .ag-total { font-family: ${statsFont}; fill: ${accent}; font-size: 15px; font-weight: 600; }
  .ag-area {
    fill: ${areaFill};
    opacity: 0;
    animation: ag-fade-in 1.2s ease-out 0.4s forwards;
  }
  .ag-line {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: url(#ag-glow);
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: ag-draw 2.2s ease-out forwards;
  }
  .ag-trend {
    fill: none;
    stroke-width: 1.2;
    stroke-dasharray: 5 4;
    opacity: 0.45;
    stroke-linecap: round;
  }
  .ag-peak-dot {
    animation: ag-pulse 1.8s ease-in-out infinite;
  }
  @keyframes ag-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  @keyframes ag-fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ag-pulse { 0%,100% { r: 4; opacity: 0.9; } 50% { r: 6; opacity: 0.4; } }
  @media (prefers-reduced-motion: reduce) {
    .ag-line { animation: none !important; stroke-dashoffset: 0; }
    .ag-area { animation: none !important; opacity: 1; }
    .ag-peak-dot { animation: none !important; }
  }`;
}

function _renderPeakAnnotation(
  peakX: number,
  peakY: number,
  peakCount: number,
  peakDate: string,
  accent: string,
  text: string,
  statsFont: string,
  isAutoTheme: boolean
): string {
  if (peakCount === 0) return '';

  // Format date label: "MMM D"
  let dateLabel = '';
  if (peakDate) {
    const parts = peakDate.split('-');
    const monthAbbrs = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const m = parts[1] ? monthAbbrs[parseInt(parts[1], 10) - 1] : '';
    const d = parts[2] ? parseInt(parts[2], 10) : '';
    dateLabel = m && d ? ` ${m} ${d}` : '';
  }

  // Flip label above or below to avoid clipping at top
  const labelY = peakY < 50 ? peakY + 22 : peakY - 14;
  const textAnchor = peakX > 600 ? 'end' : peakX < 200 ? 'start' : 'middle';
  const dotFill = isAutoTheme ? 'var(--cp-accent)' : accent;
  const labelFill = isAutoTheme ? 'var(--cp-accent)' : accent;
  const dateFill = isAutoTheme ? 'var(--cp-text)' : text;

  return `
  <g class="ag-peak">
    <circle cx="${peakX.toFixed(1)}" cy="${peakY.toFixed(1)}" r="5" fill="${dotFill}" opacity="0.25" />
    <circle class="ag-peak-dot" cx="${peakX.toFixed(1)}" cy="${peakY.toFixed(1)}" r="4" fill="${dotFill}" />
    <text x="${peakX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="${textAnchor}"
      font-family="${statsFont.replace(/"/g, "'")}" font-size="11" font-weight="700" fill="${labelFill}">${peakCount}${dateLabel ? `<tspan font-size="9.5" font-weight="400" fill="${dateFill}" opacity="0.7">${escapeXML(dateLabel)}</tspan>` : ''}</text>
  </g>`;
}
