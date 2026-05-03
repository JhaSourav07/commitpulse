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

  it('uses medium size (600x420) by default', () => {
    const svg = generateSVG(mockStats, { user: 'avi' } as unknown as BadgeParams, mockCalendar);

    expect(svg).toContain('width="600"');
    expect(svg).toContain('height="420"');
  });

  it('renders small size (400x280) when size=small', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', size: 'small' } as unknown as BadgeParams,
      mockCalendar
    );

    expect(svg).toContain('width="400"');
    expect(svg).toContain('height="280"');
  });

  it('renders large size (800x560) when size=large', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', size: 'large' } as unknown as BadgeParams,
      mockCalendar
    );

    expect(svg).toContain('width="800"');
    expect(svg).toContain('height="560"');
  });
});