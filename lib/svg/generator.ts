// SAME AS YOUR FILE (no logic change)

import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';

const FONT_MAP: Record<string, string> = {
  jetbrains: 'JetBrains Mono',
  fira: 'Fira Code',
  roboto: 'Roboto Mono',
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

export function generateSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
) {
  const bg = `#${(params.bg || '0d1117').replace('#', '')}`;
  const accent = `#${(params.accent || '00ffaa').replace('#', '')}`;
  const text = `#${(params.text || 'ffffff').replace('#', '')}`;

  const selectedFont = params.font ? FONT_MAP[params.font.toLowerCase()] || 'JetBrains Mono' : null;

  const parsedRadius = Number(params.radius);
  const radius = Math.max(0, Math.min(Number.isNaN(parsedRadius) ? 8 : parsedRadius, 50));

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
          ${
            isTodayWithCommits
              ? '<animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />'
              : ''
          }
          <title>${tooltip}</title>
          <path d="M0 10 L0 ${10 + h} L-16 ${h} L-16 0 Z" fill="${color}" fill-opacity="${
            opacity * 0.5
          }" />
          <path d="M0 10 L0 ${10 + h} L16 ${h} L16 0 Z" fill="${color}" fill-opacity="${
            opacity * 0.3
          }" />
          <path d="M0 0 L16 10 L0 20 L-16 10 Z" fill="${color}" fill-opacity="${opacity}" />
          ${
            day.contributionCount > 5
              ? `<path d="M0 0 L16 10 L0 20 L-16 10 Z" fill="white" fill-opacity="0.2" />`
              : ''
          }
        </g>`;

      if (day.contributionCount >= 10) {
        towers += generateParticles(x, y, h, accent, day.contributionCount);
      }
    });
  });

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" fill="none">

<style>
${
  params.font === 'jetbrains'
    ? `.title { font-family: 'JetBrains Mono', monospace; }`
    : `
.title { font-family: 'Syncopate', sans-serif; }
.stats { font-family: 'Space Grotesk', sans-serif; }
`
}
</style>

<rect width="600" height="420" rx="${radius}" fill="${bg}" />

<g transform="translate(0, 20)">
  ${towers}
</g>

<text x="300" y="50" text-anchor="middle" class="title">
  ${params.user?.toUpperCase?.() || ''}
</text>

<rect x="100" y="60" width="400" height="1" fill="${accent}" fill-opacity="0.3">
  <animate 
    attributeName="y" 
    values="80;320;80" 
    dur="${params.speed || '8s'}" 
    repeatCount="indefinite" />
</rect>

</svg>
`;
}
