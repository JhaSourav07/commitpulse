// lib/svg/generator.ts
import { StreakStats, BadgeParams } from '../../types';

interface ContributionDay {
  date: string;
  contributionCount: number;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export function generateSVG(
  stats: StreakStats,
  params: BadgeParams,
  calendar: ContributionCalendar
) {
  const bg = `#${(params.bg || '0d1117').replace('#', '')}`;
  const accent = `#${(params.accent || '00ffaa').replace('#', '')}`;
  const text = `#${(params.text || 'ffffff').replace('#', '')}`;

  const weeks = calendar.weeks.slice(-14); // 14 weeks for better symmetry
  let towers = '';

  weeks.forEach((week: ContributionWeek, i: number) => {
    week.contributionDays.forEach((day: ContributionDay, j: number) => {
      const isToday = i === weeks.length - 1 && j === week.contributionDays.length - 1;
      const hasCommits = day.contributionCount > 0;
      const isTodayWithCommits = isToday && hasCommits;

      const tooltip = isTodayWithCommits
        ? `TODAY: ${day.date}: ${day.contributionCount} contributions`
        : `${day.date}: ${day.contributionCount} contributions`;

      // Height scales with contribution count (linear or logarithmic)
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
          ${isTodayWithCommits ? `<animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />` : ''}
          <title>${tooltip}</title>
          <path d="M0 10 L0 ${10 + h} L-16 ${h} L-16 0 Z" fill="${color}" fill-opacity="${opacity * 0.5}" />
          <path d="M0 10 L0 ${10 + h} L16 ${h} L16 0 Z" fill="${color}" fill-opacity="${opacity * 0.3}" />
          <path d="M0 0 L16 10 L0 20 L-16 10 Z" fill="${color}" fill-opacity="${opacity}" />
          ${day.contributionCount > 5 ? `<path d="M0 0 L16 10 L0 20 L-16 10 Z" fill="white" fill-opacity="0.2" />` : ''}
        </g>`;
    });
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" fill="none">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <style>
        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@700&amp;family=Space+Grotesk:wght@300;500;700&amp;display=swap');
        .title { font-family: 'Syncopate', sans-serif; fill: ${text}; font-size: 18px; letter-spacing: 6px; opacity: 0.8; }
        .stats { font-family: 'Space Grotesk', sans-serif; fill: ${text}; font-size: 42px; font-weight: 700; }
        .total-val { font-family: 'Syncopate', sans-serif; fill: ${accent}; font-size: 24px; font-weight: 700; }
        .label { font-family: 'Space Grotesk', sans-serif; fill: ${accent}; font-size: 11px; font-weight: 700; letter-spacing: 2px; opacity: 0.7; }
      </style>

      <rect width="600" height="420" rx="32" fill="${bg}" />

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

      <text x="300" y="50" text-anchor="middle" class="title">${params.user.toUpperCase()}</text>

      <rect x="100" y="60" width="400" height="1" fill="${accent}" fill-opacity="0.3">
        <animate attributeName="y" values="80;320;80" dur="${params.speed || '8s'}" repeatCount="indefinite" />
      </rect>
    </svg>
  `;
}
