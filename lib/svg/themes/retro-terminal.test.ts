import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('retro-terminal theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('retro-terminal');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes['retro-terminal'].bg).toMatch(hexRegex);
    expect(themes['retro-terminal'].text).toMatch(hexRegex);
    expect(themes['retro-terminal'].accent).toMatch(hexRegex);
  });

  it('matches the defined retro-terminal color values for the design spec', () => {
    expect(themes['retro-terminal'].bg).toBe('000000');
    expect(themes['retro-terminal'].text).toBe('00ff41');
    expect(themes['retro-terminal'].accent).toBe('00ff41');
  });

  it('contains the specific retro-terminal hex colors in generated SVG output', () => {
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
    const defaultParams: BadgeParams = {
      user: 'testuser',
      bg: themes['retro-terminal'].bg,
      text: themes['retro-terminal'].text,
      accent: themes['retro-terminal'].accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, defaultParams, mockCalendar);

    expect(svg).toContain(`#${themes['retro-terminal'].bg}`);
    expect(svg).toContain(`#${themes['retro-terminal'].text}`);
    expect(svg).toContain(`#${themes['retro-terminal'].accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes['retro-terminal'].bg, themes['retro-terminal'].text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
