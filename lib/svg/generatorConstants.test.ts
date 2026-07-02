import { describe, it, expect } from 'vitest';
import { generateSVG } from './generator';
import type { BadgeParams } from '../../types';
import {
  MAX_USERNAME_DISPLAY_LENGTH,
  SVG_WIDTH,
  SVG_HEIGHT,
  isFontKey,
} from './generatorConstants';
import { FONT_MAP } from './fonts';

describe('generatorConstants', () => {
  it('SVG_WIDTH equals 600', () => {
    expect(SVG_WIDTH).toBe(600);
  });

  it('SVG_HEIGHT equals 420', () => {
    expect(SVG_HEIGHT).toBe(420);
  });

  it('FONT_MAP jetbrains contains JetBrains Mono', () => {
    expect(FONT_MAP.jetbrains).toContain('JetBrains Mono');
  });

  it('FONT_MAP fira contains Fira Code', () => {
    expect(FONT_MAP.fira).toContain('Fira Code');
  });

  it('FONT_MAP roboto contains Roboto', () => {
    expect(FONT_MAP.roboto).toContain('Roboto');
  });

  it('isFontKey returns true for jetbrains', () => {
    expect(isFontKey('jetbrains')).toBe(true);
  });

  it('isFontKey returns true for roboto', () => {
    expect(isFontKey('roboto')).toBe(true);
  });

  it('isFontKey returns false for unknown-font', () => {
    expect(isFontKey('unknown-font')).toBe(false);
  });

  it('isFontKey returns false for empty string', () => {
    expect(isFontKey('')).toBe(false);
  });
});

describe('FONT_MAP — previously missing bundled font entries', () => {
  it('contains syncopate — prevents duplicate @import for the design system title font', () => {
    expect(FONT_MAP).toHaveProperty('syncopate');
    expect(FONT_MAP['syncopate']).toBe('"Syncopate", sans-serif');
  });

  it('contains spacegrotesk — prevents duplicate @import for the design system stats font', () => {
    expect(FONT_MAP).toHaveProperty('spacegrotesk');
    expect(FONT_MAP['spacegrotesk']).toBe('"Space Grotesk", sans-serif');
  });

  it('contains space grotesk (with space) — handles user input with a space', () => {
    expect(FONT_MAP).toHaveProperty('space grotesk');
    expect(FONT_MAP['space grotesk']).toBe('"Space Grotesk", sans-serif');
  });

  it('contains firacode alias — handles ?font=firacode as well as ?font=fira', () => {
    expect(FONT_MAP).toHaveProperty('firacode');
    expect(FONT_MAP['firacode']).toBe('"Fira Code", monospace');
  });

  it('syncopate and spacegrotesk map to sans-serif stack — not monospace', () => {
    expect(FONT_MAP['syncopate']).toContain('sans-serif');
    expect(FONT_MAP['spacegrotesk']).toContain('sans-serif');
  });
});

describe('FONT_MAP — SVG output regression: no duplicate @import for bundled fonts', () => {
  it('font=syncopate does not generate a dynamic Google Fonts @import', () => {
    const svg = generateSVG(
      {
        currentStreak: 5,
        longestStreak: 10,
        totalContributions: 100,
        todayDate: '2024-06-12',
      },
      { user: 'chetan', font: 'syncopate' } as unknown as BadgeParams,
      {
        totalContributions: 100,
        weeks: [
          {
            contributionDays: [{ contributionCount: 5, date: '2024-06-12' }],
          },
        ],
      }
    );

    // Count how many times Syncopate appears in @import statements
    const importMatches = [...svg.matchAll(/@import url\([^)]*Syncopate[^)]*\)/gi)];
    // Must appear exactly once (the unconditional bundled import)
    // Before the fix it appeared twice — this is the regression guard
    expect(importMatches.length).toBe(1);
  });

  it('font=spacegrotesk does not generate a dynamic Google Fonts @import', () => {
    const svg = generateSVG(
      {
        currentStreak: 5,
        longestStreak: 10,
        totalContributions: 100,
        todayDate: '2024-06-12',
      },
      { user: 'chetan', font: 'spacegrotesk' } as unknown as BadgeParams,
      {
        totalContributions: 100,
        weeks: [
          {
            contributionDays: [{ contributionCount: 5, date: '2024-06-12' }],
          },
        ],
      }
    );

    const importMatches = [...svg.matchAll(/@import url\([^)]*Space\+Grotesk[^)]*\)/gi)];
    // Must appear exactly once — not twice
    expect(importMatches.length).toBe(1);
  });

  it('font=Inter still generates a dynamic @import (non-bundled font — correct behavior)', () => {
    const svg = generateSVG(
      {
        currentStreak: 5,
        longestStreak: 10,
        totalContributions: 100,
        todayDate: '2024-06-12',
      },
      { user: 'chetan', font: 'Inter' } as unknown as BadgeParams,
      {
        totalContributions: 100,
        weeks: [
          {
            contributionDays: [{ contributionCount: 5, date: '2024-06-12' }],
          },
        ],
      }
    );

    // Inter is NOT in the unconditional @import — dynamic fetch is correct here
    expect(svg).toContain('family=Inter');
  });

  it('font=syncopate resolves to Syncopate CSS font-family in style block', () => {
    const svg = generateSVG(
      {
        currentStreak: 5,
        longestStreak: 10,
        totalContributions: 100,
        todayDate: '2024-06-12',
      },
      { user: 'chetan', font: 'syncopate' } as unknown as BadgeParams,
      {
        totalContributions: 100,
        weeks: [
          {
            contributionDays: [{ contributionCount: 5, date: '2024-06-12' }],
          },
        ],
      }
    );

    expect(svg).toContain('font-family: "Syncopate", sans-serif');
  });

  it('font=spacegrotesk resolves to Space Grotesk CSS font-family in style block', () => {
    const svg = generateSVG(
      {
        currentStreak: 5,
        longestStreak: 10,
        totalContributions: 100,
        todayDate: '2024-06-12',
      },
      { user: 'chetan', font: 'spacegrotesk' } as unknown as BadgeParams,
      {
        totalContributions: 100,
        weeks: [
          {
            contributionDays: [{ contributionCount: 5, date: '2024-06-12' }],
          },
        ],
      }
    );

    expect(svg).toContain('font-family: "Space Grotesk", sans-serif');
  });
});

describe('MAX_USERNAME_DISPLAY_LENGTH', () => {
  it('is defined and is a positive integer', () => {
    expect(MAX_USERNAME_DISPLAY_LENGTH).toBeDefined();
    expect(typeof MAX_USERNAME_DISPLAY_LENGTH).toBe('number');
    expect(MAX_USERNAME_DISPLAY_LENGTH).toBeGreaterThan(0);
    expect(Number.isInteger(MAX_USERNAME_DISPLAY_LENGTH)).toBe(true);
  });

  it('equals 20 — the increased value supporting longer usernames', () => {
    expect(MAX_USERNAME_DISPLAY_LENGTH).toBe(20);
  });

  it('is less than GitHub max username length of 39 characters', () => {
    // Sanity: display truncation must be shorter than the max possible username
    expect(MAX_USERNAME_DISPLAY_LENGTH).toBeLessThan(39);
  });

  it('is coordinated with SVG_WIDTH — truncation prevents title overflow', () => {
    // At Syncopate 18px with letter-spacing 6px, each character is ~24px wide.
    // MAX_USERNAME_DISPLAY_LENGTH * 24 should be safely within SVG_WIDTH.
    const estimatedTextWidth = MAX_USERNAME_DISPLAY_LENGTH * 24;
    expect(estimatedTextWidth).toBeLessThan(SVG_WIDTH);
  });
});

// ── truncateUsername behavior via SVG output ──────────────────────────────────
// These tests verify truncateUsername() uses MAX_USERNAME_DISPLAY_LENGTH
// correctly by checking the SVG output, not the private function directly.
describe('truncateUsername — uses MAX_USERNAME_DISPLAY_LENGTH constant', () => {
  const mockStats = {
    currentStreak: 5,
    longestStreak: 10,
    totalContributions: 100,
    todayDate: '2024-06-12',
  };

  const mockCalendar = {
    totalContributions: 100,
    weeks: [
      {
        contributionDays: [{ contributionCount: 5, date: '2024-06-12' }],
      },
    ],
  };

  it('username exactly at MAX_USERNAME_DISPLAY_LENGTH is not truncated', () => {
    const exactLengthUser = 'a'.repeat(MAX_USERNAME_DISPLAY_LENGTH); // 'aaaaaaaaaaaa'
    const svg = generateSVG(
      mockStats,
      { user: exactLengthUser } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).toContain(exactLengthUser.toUpperCase());
    expect(svg).not.toContain('...');
  });

  it('username one character over MAX_USERNAME_DISPLAY_LENGTH is truncated with ...', () => {
    const longUser = 'a'.repeat(MAX_USERNAME_DISPLAY_LENGTH + 1); // 13 chars
    const svg = generateSVG(mockStats, { user: longUser } as unknown as BadgeParams, mockCalendar);
    expect(svg).toContain('...');
    // The displayed portion should be exactly MAX_USERNAME_DISPLAY_LENGTH chars
    const truncated = 'A'.repeat(MAX_USERNAME_DISPLAY_LENGTH) + '...';
    expect(svg).toContain(truncated);
  });

  it('very long GitHub username (39 chars) is truncated to MAX_USERNAME_DISPLAY_LENGTH', () => {
    const maxGitHubUser = 'a'.repeat(39);
    const svg = generateSVG(
      mockStats,
      { user: maxGitHubUser } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).toContain('...');
    // Should show exactly 12 chars + '...'
    expect(svg).toContain('A'.repeat(MAX_USERNAME_DISPLAY_LENGTH) + '...');
  });

  it('short username (under MAX_USERNAME_DISPLAY_LENGTH) is never truncated', () => {
    const shortUser = 'chetan';
    const svg = generateSVG(mockStats, { user: shortUser } as unknown as BadgeParams, mockCalendar);
    expect(svg).toContain('CHETAN');
    expect(svg).not.toContain('CHETAN...');
  });
});
