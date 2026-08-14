// lib/svg/generator.interactive-tooltips.test.ts

import { describe, it, expect } from 'vitest';
import { generateSVG } from './generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';

const mockStats: StreakStats = {
  currentStreak: 5,
  longestStreak: 12,
  totalContributions: 150,
  todayDate: '2024-10-26',
};

const mockCalendar: ContributionCalendar = {
  totalContributions: 5,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 5, date: '2024-10-26', locAdditions: 100, locDeletions: 20 },
        { contributionCount: 0, date: '2024-10-27', locAdditions: 0, locDeletions: 0 },
      ],
    },
  ],
};

describe('Interactive SVG Tower Tooltips', () => {
  it('wraps each tower within a group tag with cp-tower and interactive-tower classes', () => {
    const svg = generateSVG(mockStats, { user: 'octocat' } as unknown as BadgeParams, mockCalendar);

    expect(svg).toContain('class="cp-tower interactive-tower"');
    expect(svg).toMatch(/data-date="2024-10-26"/);
    expect(svg).toMatch(/data-count="5"/);
  });

  it('includes a native <title> tooltip element inside each tower group displaying date and contributions', () => {
    const svg = generateSVG(mockStats, { user: 'octocat' } as unknown as BadgeParams, mockCalendar);

    expect(svg).toContain('<title>TODAY: Oct 26: 5 commits</title>');
  });

  it('escapes XML reserved characters in tower tooltip elements', () => {
    const calendarWithUnsafeDate: ContributionCalendar = {
      totalContributions: 3,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 3, date: '2024-06-12 & <bad>', locAdditions: 0, locDeletions: 0 },
          ],
        },
      ],
    };

    const svg = generateSVG(
      mockStats,
      { user: 'octocat' } as unknown as BadgeParams,
      calendarWithUnsafeDate
    );

    expect(svg).toContain('data-date="2024-06-12 &amp; &lt;bad&gt;"');
    expect(svg).toContain('<title>TODAY: Jun 12: 3 commits</title>');
  });

  it('includes interactive CSS hover rules (.interactive-tower:hover) in SVG style block', () => {
    const svg = generateSVG(mockStats, { user: 'octocat' } as unknown as BadgeParams, mockCalendar);

    expect(svg).toContain('.interactive-tower');
    expect(svg).toContain('.interactive-tower:hover');
    expect(svg).toContain('transform: translateY(-4px)');
  });
});
