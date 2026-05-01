import { describe, it, expect } from 'vitest';
import { generateSVG } from './generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';

describe('generateSVG', () => {
  const mockStats = { currentStreak: 5, longestStreak: 10, totalContributions: 100 } as StreakStats;
  const mockCalendar = {
    weeks: [
      {
        contributionDays: [
          { contributionCount: 0, date: '2024-06-10' },
          { contributionCount: 5, date: '2024-06-11' },
          { contributionCount: 15, date: '2024-06-12' }, // Triggers particle generation (>10)
        ],
      },
    ],
  } as ContributionCalendar;

  it('uses default typography when no font is passed', () => {
    const svg = generateSVG(mockStats, { user: 'avi' } as unknown as BadgeParams, mockCalendar);

    expect(svg).toContain('Syncopate');
    expect(svg).toContain('Space Grotesk');
  });

  it('applies custom font when font is provided', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', font: 'jetbrains' } as unknown as BadgeParams,
      mockCalendar
    );

    expect(svg).toContain('JetBrains Mono');
  });

  it('handles radius=0 correctly', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', radius: 0 } as unknown as BadgeParams,
      mockCalendar
    );

    expect(svg).toContain('rx="0"');
  });

  it('handles log scale parameter correctly', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', scale: 'log' } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).toContain('svg');
  });

  it('generates particles for days with 10 or more contributions', () => {
    const svg = generateSVG(mockStats, { user: 'avi' } as unknown as BadgeParams, mockCalendar);
    expect(svg).toContain('class="heat-particles"');
  });

  it('defaults invalid fonts to JetBrains Mono', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', font: 'invalidfont' } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).toContain('JetBrains Mono');
  });

  it('handles missing params with defaults', () => {
    const svg = generateSVG(mockStats, {} as unknown as BadgeParams, mockCalendar);
    expect(svg).toContain('0d1117'); // default bg
    expect(svg).toContain('00ffaa'); // default accent
    expect(svg).toContain('ffffff'); // default text
  });
});
