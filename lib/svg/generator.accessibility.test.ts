import { describe, expect, it } from 'vitest';
import { generateSVG, generateHeatmapSVG, generateNotFoundSVG } from './generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';

// ── Minimal fixtures ──────────────────────────────────────────────────────

const makeCalendar = (): ContributionCalendar => ({
  weeks: [
    {
      contributionDays: [
        { date: '2024-01-01', contributionCount: 3, locAdditions: 0, locDeletions: 0 },
        { date: '2024-01-02', contributionCount: 0, locAdditions: 0, locDeletions: 0 },
        { date: '2024-01-03', contributionCount: 7, locAdditions: 0, locDeletions: 0 },
        { date: '2024-01-04', contributionCount: 1, locAdditions: 0, locDeletions: 0 },
        { date: '2024-01-05', contributionCount: 12, locAdditions: 0, locDeletions: 0 },
        { date: '2024-01-06', contributionCount: 0, locAdditions: 0, locDeletions: 0 },
        { date: '2024-01-07', contributionCount: 5, locAdditions: 0, locDeletions: 0 },
      ],
    },
  ],
  totalContributions: 28,
});

const makeStats = (): StreakStats => ({
  currentStreak: 4,
  longestStreak: 21,
  totalContributions: 312,
  todayDate: '2024-01-07',
});

const makeParams = (overrides: Partial<BadgeParams> = {}): BadgeParams =>
  ({
    user: 'testuser',
    bg: '0d1117',
    accent: '00ffaa',
    text: 'ffffff',
    ...overrides,
  }) as BadgeParams;

// ── Tests ─────────────────────────────────────────────────────────────────

describe('Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('generateSVG includes role="img", aria-labelledby, and aria-describedby on the root SVG element', () => {
    const svg = generateSVG(makeStats(), makeParams(), makeCalendar());

    expect(svg).toContain('role="img"');
    expect(svg).toMatch(/aria-labelledby="cp-title-[^"]+"/);
    expect(svg).toMatch(/aria-describedby="cp-desc-[^"]+"/);
  });

  it('generateSVG emits a <title> and <desc> whose ids match the aria-labelledby and aria-describedby values', () => {
    const svg = generateSVG(
      makeStats(),
      makeParams({ user: 'alice' } as Partial<BadgeParams>),
      makeCalendar()
    );

    // Extract the declared aria ids
    const labelledBy = svg.match(/aria-labelledby="([^"]+)"/)?.[1];
    const describedBy = svg.match(/aria-describedby="([^"]+)"/)?.[1];

    expect(labelledBy).toBeDefined();
    expect(describedBy).toBeDefined();

    // The matching id-bearing elements must exist
    expect(svg).toContain(`id="${labelledBy}"`);
    expect(svg).toContain(`id="${describedBy}"`);
  });

  it('generateSVG <desc> element contains meaningful stats for screen readers', () => {
    const stats = makeStats();
    const svg = generateSVG(
      stats,
      makeParams({ user: 'bob' } as Partial<BadgeParams>),
      makeCalendar()
    );

    // The <desc> should mention the username, total contributions, and longest streak
    expect(svg).toMatch(/<desc[^>]*>[\s\S]*bob[\s\S]*<\/desc>/i);
    expect(svg).toMatch(/<desc[^>]*>[\s\S]*312[\s\S]*<\/desc>/);
    expect(svg).toMatch(/<desc[^>]*>[\s\S]*21[\s\S]*<\/desc>/);
  });

  it('interactive towers carry a <title> tooltip for assistive technology announcement', () => {
    const svg = generateSVG(makeStats(), makeParams(), makeCalendar());

    // Every interactive tower group must contain at least one <title> child
    const towerGroupMatches = [...svg.matchAll(/<g class="cp-tower[^"]*"[^>]*>([\s\S]*?)<\/g>/g)];

    expect(towerGroupMatches.length).toBeGreaterThan(0);

    towerGroupMatches.forEach((match) => {
      expect(match[1]).toMatch(/<title>/);
    });
  });

  it('generateNotFoundSVG and generateHeatmapSVG also satisfy role/aria requirements', () => {
    const notFoundSvg = generateNotFoundSVG('ghost', '#0d1117', '#00ffaa', '#ffffff', 8, '8s');

    expect(notFoundSvg).toContain('role="img"');
    expect(notFoundSvg).toMatch(/aria-labelledby="[^"]+"/);
    expect(notFoundSvg).toMatch(/aria-describedby="[^"]+"/);

    const heatmapSvg = generateHeatmapSVG(makeStats(), makeParams(), makeCalendar());

    expect(heatmapSvg).toContain('role="img"');
    // Heatmap uses an inline title/desc without aria ids but must still carry role
    expect(heatmapSvg).toContain('<title>');
    expect(heatmapSvg).toContain('<desc>');
  });
});
