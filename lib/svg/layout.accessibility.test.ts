/**
 * DEFINITION OF DONE:
 * 1. Inspect markup for correct use of accessible label coordinates (role, aria-labelledby, aria-describedby).
 * 2. Assert elements that accept key focus (interactive towers) maintain visible behaviors (brightness/shadow).
 * 3. Verify tooltip labels (<title> in towers) are announced with contribution data.
 * 4. Test keyboard control path (data-date, data-count, data-metric) to ensure consistent ordering.
 * 5. Confirm standard document-level headings (<title>, <desc>) exist in logical order.
 */

import { describe, expect, it } from 'vitest';
import { generateSVG } from './generator';
import { computeTowers } from './layout';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';

// ── Minimal fixtures ──────────────────────────────────────────────────────

const makeCalendar = (): ContributionCalendar => ({
  weeks: [
    {
      contributionDays: [
        { date: '2024-06-10', contributionCount: 5, locAdditions: 50, locDeletions: 10 },
        { date: '2024-06-11', contributionCount: 0, locAdditions: 0, locDeletions: 0 },
      ],
    },
  ],
  totalContributions: 5,
});

const makeStats = (): StreakStats => ({
  currentStreak: 1,
  longestStreak: 5,
  totalContributions: 5,
  todayDate: '2024-06-11',
});

const makeParams = (overrides: Partial<BadgeParams> = {}): BadgeParams =>
  ({
    user: 'testuser',
    bg: '0d1117',
    text: 'ffffff',
    accent: '00ffaa',
    speed: '8s',
    scale: 'linear',
    ...overrides,
  }) as BadgeParams;

// ── Tests ─────────────────────────────────────────────────────────────────

describe('Layout Accessibility Standards & Screen Reader Aria Compliance', () => {
  // 1. Accessible Label Coordinates
  it('inspects markup for correct use of role="img" and aria labels tied to title/desc', () => {
    const svg = generateSVG(makeStats(), makeParams({ user: 'alice' }), makeCalendar());

    expect(svg).toContain('role="img"');

    const labelledBy = svg.match(/aria-labelledby="([^"]+)"/)?.[1];
    const describedBy = svg.match(/aria-describedby="([^"]+)"/)?.[1];

    expect(labelledBy).toBeDefined();
    expect(describedBy).toBeDefined();

    // Ensure IDs exist in the markup
    expect(svg).toContain(`id="${labelledBy}"`);
    expect(svg).toContain(`id="${describedBy}"`);

    // Title should contain the entity name and user
    expect(svg).toMatch(new RegExp(`<title id="${labelledBy}">.*User.*alice`, 'i'));
  });

  // 2. Interactive Element Focus Behaviors
  it('asserts interactive towers maintain visible outline behaviors (brightness/shadow) via CSS', () => {
    const svg = generateSVG(makeStats(), makeParams(), makeCalendar());

    // Check for interactive tower class and hover styles in <style> block
    expect(svg).toContain('class="cp-tower interactive-tower"');
    expect(svg).toContain('.interactive-tower:hover');
    expect(svg).toMatch(/filter:\s*brightness\(1\.2\)\s*drop-shadow/);
    expect(svg).toMatch(/cursor:\s*pointer/);
  });

  // 3. Tooltip Labels & Descriptions
  it('verifies tooltip labels are announced with correct accessibility descriptions (DATE: COUNT UNIT)', () => {
    // Standard mode
    const calendar = makeCalendar();
    const towers = computeTowers(calendar, 'linear', '2024-06-11');
    expect(towers[0].tooltip).toMatch(/^\d{4}-\d{2}-\d{2}: 5 contributions$/);
    expect(towers[1].tooltip).toContain('TODAY: 2024-06-11: 0 contributions');

    const svg = generateSVG(makeStats(), makeParams(), calendar);
    const towerTitles = [...svg.matchAll(/<title>(.*?)<\/title>/g)].map((m) => m[1]);
    expect(towerTitles).toContain('2024-06-10: 5 contributions');
    expect(towerTitles).toContain('TODAY: 2024-06-11: 0 contributions');

    // LoC mode
    const locSvg = generateSVG(makeStats(), makeParams({ mode: 'loc' }), calendar);
    expect(locSvg).toContain('60 est. lines of code');
  });

  // 4. Keyboard Control Path & Ordering
  it('tests keyboard control path selectors to ensure normal chronological tab ordering', () => {
    const calendar = {
      weeks: [
        {
          contributionDays: [
            { date: '2024-06-01', contributionCount: 1 },
            { date: '2024-06-02', contributionCount: 2 },
          ],
        },
      ],
    } as unknown as ContributionCalendar;

    const svg = generateSVG(makeStats(), makeParams(), calendar);

    // Extract dates in DOM order
    const datesInDomOrder = [...svg.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]);

    expect(datesInDomOrder.length).toBe(2);
    expect(datesInDomOrder[0]).toBe('2024-06-01');
    expect(datesInDomOrder[1]).toBe('2024-06-02');

    // Verify accessibility metadata used for navigation
    expect(svg).toContain('data-metric="Active day"');
    expect(svg).toContain('data-count="1"');
  });

  // 5. Logical Hierarchical Order (Headings)
  it('confirms standard headings exist in the correct logical hierarchical order', () => {
    const svg = generateSVG(makeStats(), makeParams({ user: 'bob' }), makeCalendar());

    const titleIdx = svg.indexOf('<title');
    const descIdx = svg.indexOf('<desc');
    const styleIdx = svg.indexOf('<style');
    const contentIdx = svg.indexOf('<g id="cp-towers"');

    // Logical order: title -> desc -> style -> content
    expect(titleIdx).toBeLessThan(descIdx);
    expect(descIdx).toBeLessThan(styleIdx);
    expect(styleIdx).toBeLessThan(contentIdx);

    // Visual labels should follow towers in DOM if they are footer-like
    const footerLabelIdx = svg.indexOf('class="label"');
    if (footerLabelIdx !== -1) {
      expect(contentIdx).toBeLessThan(footerLabelIdx);
    }
  });
});
