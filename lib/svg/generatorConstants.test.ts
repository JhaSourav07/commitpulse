import { describe, it, expect } from 'vitest';
import { SVG_WIDTH, SVG_HEIGHT, isFontKey } from './generatorConstants';
import { FONT_MAP } from './fonts';
import { generateSVG } from './generator';
import type { BadgeParams } from '../../types';

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
