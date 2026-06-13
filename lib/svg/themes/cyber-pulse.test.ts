import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('cyber-pulse theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('cyber-pulse');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes['cyber-pulse'].bg).toMatch(hexRegex);
    expect(themes['cyber-pulse'].text).toMatch(hexRegex);
    expect(themes['cyber-pulse'].accent).toMatch(hexRegex);
  });

  it('matches the defined cyber-pulse color values for the design spec', () => {
    expect(themes['cyber-pulse'].bg).toBe('000000');
    expect(themes['cyber-pulse'].text).toBe('ffffff');
    expect(themes['cyber-pulse'].accent).toBe('00ffee');
  });

  it('contains the specific cyber-pulse hex colors in generated SVG output', () => {
    const mockStats: StreakStats = {
      currentStreak: 5,
      longestStreak: 10,
      totalContributions: 100,
      todayDate: '2024-06-12',
    };
    const mockCalendar: ContributionCalendar = {
      totalContributions: 10,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 5, date: '2024-06-11' },
            { contributionCount: 5, date: '2024-06-12' },
          ],
        },
      ],
    };
    const cyberPulseParams: BadgeParams = {
      user: 'testuser',
      bg: themes['cyber-pulse'].bg,
      text: themes['cyber-pulse'].text,
      accent: themes['cyber-pulse'].accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, cyberPulseParams, mockCalendar);

    expect(svg).toContain(`#${themes['cyber-pulse'].bg}`);
    expect(svg).toContain(`#${themes['cyber-pulse'].text}`);
    expect(svg).toContain(`#${themes['cyber-pulse'].accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes['cyber-pulse'].bg, themes['cyber-pulse'].text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
