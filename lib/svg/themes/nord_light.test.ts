import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('nord_light theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('nord_light');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.nord_light.bg).toMatch(hexRegex);
    expect(themes.nord_light.text).toMatch(hexRegex);
    expect(themes.nord_light.accent).toMatch(hexRegex);
  });

  it('matches the defined nord_light color values for the design spec', () => {
    expect(themes.nord_light.bg).toBe('eceff4');
    expect(themes.nord_light.text).toBe('2e3440');
    expect(themes.nord_light.accent).toBe('5e81ac');
  });

  it('contains the specific nord_light hex colors in generated SVG output', () => {
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
    const nordLightParams: BadgeParams = {
      user: 'testuser',
      bg: themes.nord_light.bg,
      text: themes.nord_light.text,
      accent: themes.nord_light.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, nordLightParams, mockCalendar);

    expect(svg).toContain(`#${themes.nord_light.bg}`);
    expect(svg).toContain(`#${themes.nord_light.text}`);
    expect(svg).toContain(`#${themes.nord_light.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.nord_light.bg, themes.nord_light.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
