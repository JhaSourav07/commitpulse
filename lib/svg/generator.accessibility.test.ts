import { describe, it, expect } from 'vitest';
import { generateSVG, generateHeatmapSVG, generateVersusSVG } from './generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';
import { hexColor } from './sanitizer';

describe('SVG accessibility attributes (WCAG 1.1.1)', () => {
  const mockStats: StreakStats = {
    currentStreak: 5,
    longestStreak: 10,
    totalContributions: 100,
    todayDate: '2024-06-12',
  };
  const mockCalendar = {
    weeks: [
      {
        contributionDays: [
          { contributionCount: 0, date: '2024-06-10' },
          { contributionCount: 5, date: '2024-06-11' },
          { contributionCount: 15, date: '2024-06-12' },
        ],
      },
    ],
  } as ContributionCalendar;

  const baseParams: BadgeParams = {
    user: 'avi',
    bg: hexColor('0d1117'),
    text: hexColor('c9d1d9'),
    accent: hexColor('58a6ff'),
    speed: '8s',
    scale: 'linear',
  } as BadgeParams;

  it('root SVG exposes focusable="false" alongside role="img"', () => {
    const svg = generateSVG(mockStats, baseParams, mockCalendar);

    expect(svg).toMatch(/<svg[^>]*role="img"/);
    expect(svg).toMatch(/<svg[^>]*focusable="false"/);
  });

  it('marks the decorative towers group as focusable="false" so it is not announced individually', () => {
    const svg = generateSVG(mockStats, baseParams, mockCalendar);

    expect(svg).toMatch(/<g id="cp-towers"[^>]*focusable="false"/);
  });

  it('marks decorative heat particles as focusable="false" and aria-hidden', () => {
    const svg = generateSVG(mockStats, baseParams, mockCalendar);

    if (svg.includes('heat-particles')) {
      expect(svg).toMatch(/<g class="heat-particles"[^>]*focusable="false"[^>]*aria-hidden="true"/);
    }
  });

  it('heatmap SVG root exposes focusable="false"', () => {
    const svg = generateHeatmapSVG(mockStats, baseParams, mockCalendar);

    expect(svg).toMatch(/<svg[^>]*role="img"/);
    expect(svg).toMatch(/<svg[^>]*focusable="false"/);
  });

  it('versus SVG root exposes focusable="false"', () => {
    const svg = generateVersusSVG(
      mockStats,
      { currentStreak: 2, longestStreak: 4, totalContributions: 40, todayDate: '2024-06-12' },
      { ...baseParams, user: 'avi', versus: 'octocat' } as BadgeParams,
      mockCalendar,
      mockCalendar
    );

    expect(svg).toMatch(/<svg[^>]*focusable="false"/);
  });
});
