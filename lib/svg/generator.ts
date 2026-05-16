import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';
import { AUTO_DARK_THEME, AUTO_LIGHT_THEME } from './themes';

const FONT_MAP: Record<string, string> = {
  jetbrains: '"JetBrains Mono", monospace',
  fira: '"Fira Code", monospace',
  roboto: '"Roboto", sans-serif',
};

function deterministicRandom(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
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
        <animate attributeName="cy"
          from="${y - height}"
          to="${y - height - 20}"
          dur="1.5s"
          begin="${delay}s"
          repeatCount="indefinite" />
        <animate attributeName="opacity"
          from="1" to="0"
          dur="1.5s"
          begin="${delay}s"
          repeatCount="indefinite" />
      </circle>
    `;
  }

  return `<g class="heat-particles">${particles}</g>`;
}

// Auto-theme variant: particles reference a CSS class instead of an
// inline fill so the color can switch via prefers-color-scheme.
function generateAutoParticles(x: number, y: number, height: number, count: number): string {
  let particles = '';
  const particleCount = Math.min(5, Math.max(3, Math.floor(count / 4)));

  for (let i = 0; i < particleCount; i++) {
    const seed = `${x}:${y}:${height}:auto:${count}:${i}`;
    const offsetX = deterministicRandom(`${seed}:offsetX`) * 6 - 3;
    const delay = deterministicRandom(`${seed}:delay`) * 1.5;

    particles += `
      <circle class="cp-accent-fill" cx="${x + offsetX}" cy="${y - height}" r="1.5" opacity="1">
        <animate attributeName="cy"
          from="${y - height}"
          to="${y - height - 20}"
          dur="1.5s"
          begin="${delay}s"
          repeatCount="indefinite" />
        <animate attributeName="opacity"
          from="1" to="0"
          dur="1.5s"
          begin="${delay}s"
          repeatCount="indefinite" />
      </circle>
    `;
  }

  return `<g class="heat-particles">${particles}</g>`;
}

/** Shared layout data for a single isometric tower. */
interface TowerData {
  x: number;
  y: number;
  h: number;
  hasCommits: boolean;
  isToday: boolean;
  isTodayWithCommits: boolean;
  tooltip: string;
  contributionCount: number;
  opacity: number;
}

/** Computes tower positions and heights from the last 14 weeks of
 *  contribution data. The layout math is identical for both the
 *  static-theme and auto-theme rendering paths. */
function computeTowers(calendar: ContributionCalendar, scale: 'linear' | 'log'): TowerData[] {
  const weeks = calendar.weeks.slice(-14);
  const towers: TowerData[] = [];

  weeks.forEach((week, i) => {
    week.contributionDays.forEach((day, j) => {
      const isToday = i === weeks.length - 1 && j === week.contributionDays.length - 1;
      const hasCommits = day.contributionCount > 0;
      const isTodayWithCommits = isToday && hasCommits;

      const tooltip = isTodayWithCommits
        ? `TODAY: ${day.date}: ${day.contributionCount} contributions`
        : `${day.date}: ${day.contributionCount} contributions`;

      const h =
        scale === 'log'
          ? Math.min(day.contributionCount > 0 ? Math.log2(day.contributionCount + 1) * 12 : 0, 80)
          : Math.min(day.contributionCount * 5, 50);

      const x = 300 + (i - j) * 16;
      const y = 120 + (i + j) * 9;
      const opacity = hasCommits ? 0.7 : 0.05;

      towers.push({
        x,
        y,
        h,
        hasCommits,
        isToday,
        isTodayWithCommits,
        tooltip,
        contributionCount: day.contributionCount,
        opacity,
      });
    });
  });

  return towers;
}

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

  const defaultTitleFont = '"Syncopate", sans-serif';
  const defaultBodyFont = '"Space Grotesk", sans-serif';

  const statsFont = selectedFont || defaultBodyFont;
  const labelFont = '"Roboto", sans-serif';

  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50));

  const towerData = computeTowers(calendar, params.scale);
  let towers = '';

  for (const t of towerData) {
    const color = t.hasCommits ? accent : text;

    towers += `
        <g transform="translate(${t.x}, ${t.y - t.h})">
          ${
            t.isTodayWithCommits
              ? '<animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />'
              : ''
          }
          <title>${t.tooltip}</title>
          <path d="M0 10 L0 ${10 + t.h} L-16 ${t.h} L-16 0 Z" fill="${color}" fill-opacity="${
            t.opacity * 0.5
          }" />
          <path d="M0 10 L0 ${10 + t.h} L16 ${t.h} L16 0 Z" fill="${color}" fill-opacity="${
            t.opacity * 0.3
          }" />
          <path d="M0 0 L16 10 L0 20 L-16 10 Z" fill="${color}" fill-opacity="${t.opacity}" />
          ${
            t.contributionCount > 5
              ? `<path d="M0 0 L16 10 L0 20 L-16 10 Z" fill="white" fill-opacity="0.2" />`
              : ''
          }
        </g>`;

    if (t.contributionCount >= 10) {
      towers += generateParticles(t.x, t.y, t.h, accent, t.contributionCount);
    }
  }

  // dynamic google fonts import
  const googleFontsImport =
    sanitizedFont && !isPredefinedFont
      ? `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(
          sanitizedFont
        ).replace(/%20/g, '+')}&amp;display=swap');`
      : '';

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" fill="none">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;display=swap');
  ${googleFontsImport}

  .title {
    font-family: ${selectedFont || defaultTitleFont};
    fill: ${text};
    font-size: 18px;
    letter-spacing: 6px;
    font-weight: 400;
    opacity: 0.8;
  }

  .stats {
    font-family: ${statsFont};
    fill: ${text};
    font-size: 42px;
    font-weight: 500;
    letter-spacing: 0;
  }

  .total-val {
    font-family: ${statsFont};
    fill: ${accent};
    font-size: 24px;
    font-weight: 500;
  }

  .label {
    font-family: ${labelFont};
    fill: ${accent};
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 2px;
    opacity: 0.7;
  }

  @media (prefers-reduced-motion: reduce) {
    .heat-particles { display: none; }
  }
  </style>

  <rect width="600" height="420" rx="${radius}" fill="${bg}" />

  <g transform="translate(0, 20)">
    ${towers}
  </g>

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

  <text x="300" y="50" text-anchor="middle" class="title">${params.user?.toUpperCase() || ''}</text>

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

  const selectedFont = params.font
    ? FONT_MAP[params.font.toLowerCase()] || '"JetBrains Mono", monospace'
    : null;

  const defaultTitleFont = '"Syncopate", sans-serif';
  const defaultBodyFont = '"Space Grotesk", sans-serif';

  const statsFont = selectedFont || defaultBodyFont;
  const labelFont = '"Roboto", sans-serif';

  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50));

  const towerData = computeTowers(calendar, params.scale);
  let towers = '';

  for (const t of towerData) {
    // Use CSS classes for fill so the color switches via the media query.
    // cp-accent-fill → var(--cp-accent), cp-text-fill → var(--cp-text)
    const fillClass = t.hasCommits ? 'cp-accent-fill' : 'cp-text-fill';

    towers += `
        <g transform="translate(${t.x}, ${t.y - t.h})">
          ${
            t.isTodayWithCommits
              ? '<animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />'
              : ''
          }
          <title>${t.tooltip}</title>
          <path d="M0 10 L0 ${10 + t.h} L-16 ${t.h} L-16 0 Z" class="${fillClass}" fill-opacity="${
            t.opacity * 0.5
          }" />
          <path d="M0 10 L0 ${10 + t.h} L16 ${t.h} L16 0 Z" class="${fillClass}" fill-opacity="${
            t.opacity * 0.3
          }" />
          <path d="M0 0 L16 10 L0 20 L-16 10 Z" class="${fillClass}" fill-opacity="${t.opacity}" />
          ${
            t.contributionCount > 5
              ? `<path d="M0 0 L16 10 L0 20 L-16 10 Z" fill="white" fill-opacity="0.2" />`
              : ''
          }
        </g>`;

    if (t.contributionCount >= 10) {
      towers += generateAutoParticles(t.x, t.y, t.h, t.contributionCount);
    }
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" fill="none">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code&amp;family=JetBrains+Mono&amp;family=Roboto&amp;display=swap');

  /* Light-mode defaults (shown when the viewer's OS is in light mode) */
  :root {
    --cp-bg: #${light.bg};
    --cp-text: #${light.text};
    --cp-accent: #${light.accent};
  }

  /* Dark-mode overrides (shown when the viewer's OS is in dark mode) */
  @media (prefers-color-scheme: dark) {
    :root {
      --cp-bg: #${dark.bg};
      --cp-text: #${dark.text};
      --cp-accent: #${dark.accent};
    }
  }

  /* Utility classes that reference the custom properties so every
     fill swaps automatically when the media query triggers. */
  .cp-bg-fill     { fill: var(--cp-bg); }
  .cp-text-fill   { fill: var(--cp-text); }
  .cp-accent-fill { fill: var(--cp-accent); }

  .title {
    font-family: ${selectedFont || defaultTitleFont};
    fill: var(--cp-text);
    font-size: 18px;
    letter-spacing: 6px;
    font-weight: 400;
    opacity: 0.8;
  }

  .stats {
    font-family: ${statsFont};
    fill: var(--cp-text);
    font-size: 42px;
    font-weight: 500;
    letter-spacing: 0;
  }

  .total-val {
    font-family: ${statsFont};
    fill: var(--cp-accent);
    font-size: 24px;
    font-weight: 500;
  }

  .label {
    font-family: ${labelFont};
    fill: var(--cp-accent);
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 2px;
    opacity: 0.7;
  }

  @media (prefers-reduced-motion: reduce) {
    .heat-particles { display: none; }
  }
  </style>

  <rect width="600" height="420" rx="${radius}" class="cp-bg-fill" />

  <g transform="translate(0, 20)">
    ${towers}
  </g>

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

  <text x="300" y="50" text-anchor="middle" class="title">${params.user?.toUpperCase() || ''}</text>

  <rect x="100" y="60" width="400" height="1" class="cp-accent-fill" fill-opacity="0.3">
    <animate attributeName="y" values="80;320;80" dur="${params.speed || '8s'}" repeatCount="indefinite" />
  </rect>
</svg>
`;
}
