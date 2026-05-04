// lib/svg/generator.ts
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';

export const FONT_OPTIONS: Record<string, { title: string; display: string; body: string }> = {
  default: { title: 'Default', display: 'Syncopate', body: 'Space Grotesk' },
  mono: { title: 'Mono', display: 'JetBrains Mono', body: 'JetBrains Mono' },
  jetbrains: { title: 'JetBrains', display: 'JetBrains Mono', body: 'JetBrains Mono' },
  elegant: { title: 'Elegant', display: 'Playfair Display', body: 'Lato' },
  minimal: { title: 'Minimal', display: 'DM Sans', body: 'DM Sans' },
  retro: { title: 'Retro', display: 'Press Start 2P', body: 'VT323' },
};

const SIZE_MAP = {
  small: { width: 400, height: 280 },
  medium: { width: 600, height: 420 },
  large: { width: 800, height: 560 },
} as const;

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
        <animate attributeName="cy" from="${y - height}" to="${y - height - 20}" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="${delay}s" repeatCount="indefinite" />
      </circle>
    `;
  }

  return `<g class="heat-particles">${particles}</g>`;
}

export function generateSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
) {
  const bg = `#${(params.bg || '0d1117').replace('#', '')}`;
  const accent = `#${(params.accent || '00ffaa').replace('#', '')}`;
  const text = `#${(params.text || 'ffffff').replace('#', '')}`;

  const fontKey = params.font
    ? FONT_OPTIONS[params.font]
      ? params.font
      : 'jetbrains'
    : 'default';
  const { display: displayFont, body: bodyFont } = FONT_OPTIONS[fontKey];

  const labelFont = 'Roboto';

  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50));

  const sizeKey = (params.size as keyof typeof SIZE_MAP) ?? 'medium';
  const { width, height } = SIZE_MAP[sizeKey] ?? SIZE_MAP.medium;
  const scale = width / 600;

  const weeks = calendar.weeks.slice(-14);
  let towers = '';

  weeks.forEach((week, i) => {
    week.contributionDays.forEach((day, j) => {
      const isToday = i === weeks.length - 1 && j === week.contributionDays.length - 1;
      const hasCommits = day.contributionCount > 0;
      const isTodayWithCommits = isToday && hasCommits;

      const tooltip = isTodayWithCommits
        ? `TODAY: ${day.date}: ${day.contributionCount} contributions`
        : `${day.date}: ${day.contributionCount} contributions`;

      const h =
        params.scale === 'log'
          ? Math.min(day.contributionCount > 0 ? Math.log2(day.contributionCount + 1) * 12 : 0, 80)
          : Math.min(day.contributionCount * 5, 50);

      const x = 300 + (i - j) * 16;
      const y = 120 + (i + j) * 9;
      const color = hasCommits ? accent : text;
      const opacity = hasCommits ? 0.7 : 0.05;

      towers += `
        <g transform="translate(${x}, ${y - h})">
          ${isTodayWithCommits ? '<animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />' : ''}
          <title>${tooltip}</title>
          <path d="M0 10 L0 ${10 + h} L-16 ${h} L-16 0 Z" fill="${color}" fill-opacity="${opacity * 0.5}" />
          <path d="M0 10 L0 ${10 + h} L16 ${h} L16 0 Z" fill="${color}" fill-opacity="${opacity * 0.3}" />
          <path d="M0 0 L16 10 L0 20 L-16 10 Z" fill="${color}" fill-opacity="${opacity}" />
          ${day.contributionCount > 5 ? `<path d="M0 0 L16 10 L0 20 L-16 10 Z" fill="white" fill-opacity="0.2" />` : ''}
        </g>`;

      if (day.contributionCount >= 10) {
        towers += generateParticles(x, y, h, accent, day.contributionCount);
      }
    });
  });

  const importUrl = `https://fonts.googleapis.com/css2?family=${displayFont.replace(/ /g, '+')}:wght@700&amp;family=${bodyFont.replace(/ /g, '+')}:wght@300;500;700&amp;display=swap`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <style>
    @import url('${importUrl}');
    .title { font-family: '${displayFont}', sans-serif; fill: ${text}; font-size: ${18 * scale}px; letter-spacing: 6px; opacity: 0.8; }
    .stats { font-family: '${bodyFont}', sans-serif; fill: ${text}; font-size: ${42 * scale}px; font-weight: 700; }
    .total-val { font-family: '${displayFont}', sans-serif; fill: ${accent}; font-size: ${24 * scale}px; font-weight: 700; }
    .label { font-family: '${labelFont}', sans-serif; fill: ${accent}; font-size: ${11 * scale}px; font-weight: 700; letter-spacing: 2px; opacity: 0.7; }
    @media (prefers-reduced-motion: reduce) { .heat-particles { display: none; } }
  </style>
  <rect width="${width}" height="${height}" rx="${radius}" fill="${bg}" />
  <g transform="translate(0, ${20 * scale}) scale(${scale})">
    ${towers}
  </g>
  <g transform="translate(${40 * scale}, ${340 * scale})">
    <text class="label">CURRENT_STREAK</text>
    <text y="${40 * scale}" class="stats" filter="url(#glow)">${stats.currentStreak}</text>
  </g>
  <g transform="translate(${width / 2}, ${340 * scale})" text-anchor="middle">
    <text class="label">ANNUAL_SYNC_TOTAL</text>
    <text y="${40 * scale}" class="total-val" filter="url(#glow)">${stats.totalContributions}</text>
  </g>
  <g transform="translate(${width - 40 * scale}, ${340 * scale})" text-anchor="end">
    <text class="label">PEAK_STREAK</text>
    <text y="${40 * scale}" class="stats">${stats.longestStreak}</text>
  </g>
  <text x="${width / 2}" y="${50 * scale}" text-anchor="middle" class="title">${params.user?.toUpperCase() || ''}</text>
  <rect x="${100 * scale}" y="${60 * scale}" width="${400 * scale}" height="1" fill="${accent}" fill-opacity="0.3">
    <animate attributeName="y" values="${80 * scale};${320 * scale};${80 * scale}" dur="${params.speed || '8s'}" repeatCount="indefinite" />
  </rect>
</svg>`;
}