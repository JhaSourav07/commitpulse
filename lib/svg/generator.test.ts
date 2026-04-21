import { describe, it, expect } from 'vitest';
import { generateSVG } from './generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';

describe('generateSVG', () => {
  const mockStats = {} as unknown as StreakStats;
  const mockCalendar = { weeks: [] } as unknown as ContributionCalendar;

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
});
