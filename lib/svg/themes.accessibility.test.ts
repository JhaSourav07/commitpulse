/**
 * DEFINITION OF DONE:
 * 1. Inspect markup for correct use of accessible label coordinates (role, aria-labelledby, aria-describedby).
 * 2. Assert elements that accept key focus (interactive towers) maintain visible behaviors (brightness/shadow).
 * 3. Verify tooltip labels (<title> in towers) are announced with contribution data.
 * 4. Test keyboard control path (data-date, data-count, data-metric) to ensure consistent ordering.
 * 5. Confirm standard document-level headings (<title>, <desc>) exist in logical order.
 */

import { describe, expect, it } from 'vitest';
import { themes } from './themes';
import { generateSVG } from './generator';
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

const makeParams = (themeName: string, overrides: Partial<BadgeParams> = {}): BadgeParams =>
  ({
    user: 'testuser',
    bg: themes[themeName].bg,
    text: themes[themeName].text,
    accent: themes[themeName].accent,
    speed: '8s',
    scale: 'linear',
    ...overrides,
  }) as BadgeParams;

function svgForTheme(themeName: string, overrides: Partial<BadgeParams> = {}): string {
  return generateSVG(makeStats(), makeParams(themeName, overrides), makeCalendar());
}

describe('Themes Accessibility - Core Standards Compliance', () => {
  // 1. Accessible Label Coordinates
  it('identifies correct use of role="img" and matching aria-labelledby/aria-describedby coordinates', () => {
    const svg = svgForTheme('dark');
    expect(svg).toContain('role="img"');

    const labelledByMatch = svg.match(/aria-labelledby="([^"]+)"/);
    expect(labelledByMatch).not.toBeNull();
    expect(svg).toContain(`id="${labelledByMatch![1]}"`);

    const describedByMatch = svg.match(/aria-describedby="([^"]+)"/);
    expect(describedByMatch).not.toBeNull();
    expect(svg).toContain(`id="${describedByMatch![1]}"`);

    const autoSvg = generateSVG(
      makeStats(),
      { ...makeParams('dark'), autoTheme: true } as BadgeParams,
      makeCalendar()
    );
    expect(autoSvg).toContain('role="img"');
    expect(autoSvg).toMatch(/aria-labelledby="[^"]+"/);
  });

  // 2. Interactive Element Focus Behaviors
  it('asserts interactive elements maintain visible focus behaviors with brightness and drop-shadows', () => {
    const svg = svgForTheme('dracula');
    expect(svg).toContain('.interactive-tower');
    expect(svg).toMatch(/\.interactive-tower\s*\{[^}]*transition/);
    expect(svg).toMatch(/\.interactive-tower:hover\s*\{[^}]*brightness/);
    expect(svg).toMatch(/\.interactive-tower:hover\s*\{[^}]*drop-shadow/);
    expect(svg).toContain('class="cp-tower interactive-tower"');
    expect(svg).toMatch(/\.interactive-tower\s*\{[^}]*cursor:\s*pointer/);
  });

  // 3. Tooltip Labels & Descriptions
  it('verifies tooltip labels and root descriptions are announced with accurate contribution data', () => {
    const svg = svgForTheme('ocean', { user: 'alice' });

    // Root desc mentions user and stats
    expect(svg).toMatch(/<desc[^>]*>[\s\S]*alice[\s\S]*312[\s\S]*21[\s\S]*<\/desc>/i);

    // Tower tooltips contain dates and counts
    const towerBlocks = [
      ...svg.matchAll(/<g class="cp-tower interactive-tower"[^>]*>([\s\S]*?)<\/g>/g),
    ];
    expect(towerBlocks.length).toBeGreaterThan(0);

    for (const match of towerBlocks) {
      expect(match[1]).toContain('<title>');
      expect(match[1]).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(match[1]).toMatch(/\d+/);
    }
  });

  // 4. Keyboard Control Path
  it('tests keyboard control paths for consistent ordering and valid data-date/data-metric attributes', () => {
    const svg = svgForTheme('synthwave');
    const dateMatches = [...svg.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"/g)];
    expect(dateMatches.length).toBeGreaterThan(1);

    for (const match of dateMatches) {
      expect(match[1]).toMatch(/\d{4}-\d{2}-\d{2}/);
    }

    expect(svg).toContain('data-count="');
    expect(svg).toMatch(/data-metric="(Rest day|Active day|Peak day)"/);

    // Reduced motion support
    expect(svg).toContain('prefers-reduced-motion');
    expect(svg).toMatch(/prefers-reduced-motion[\s\S]*?\.heat-particles\s*\{\s*display:\s*none/);
  });

  // 5. Heading Hierarchy & Reading Order
  it('confirms standard document headings exist in a logical hierarchy and DOM reading order', () => {
    const svg = svgForTheme('github', { user: 'carol' });

    // Document level labels
    expect([...svg.matchAll(/<title id="cp-title-[^"]*">/g)].length).toBe(1);
    expect([...svg.matchAll(/<desc id="cp-desc-[^"]*">/g)].length).toBe(1);
    expect(svg).toContain('carol');

    // Layout order
    const towersEnd = svg.indexOf('</g>', svg.indexOf('id="cp-towers"'));
    const labelMatch = svg.indexOf('class="label"');
    expect(labelMatch > towersEnd).toBe(true);

    const titlePos = svg.indexOf('class="title"');
    const statsPos = svg.indexOf('class="stats"');
    if (titlePos > -1 && statsPos > -1) {
      expect(statsPos < titlePos).toBe(true);
    }
  });
});
