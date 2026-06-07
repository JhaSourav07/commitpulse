// lib/svg/constants.mouse-interactivity.test.ts

import { describe, expect, it } from 'vitest';
import { SVG_WIDTH, SVG_HEIGHT, CONTRIBUTION_MILESTONES, STREAK_MILESTONES } from './constants';
import { FONT_MAP } from './fonts';

describe('SVG Constants Mouse Interactivity', () => {
  it('provides valid SVG dimensions for interactive layouts', () => {
    expect(SVG_WIDTH).toBeGreaterThan(0);
    expect(SVG_HEIGHT).toBeGreaterThan(0);
  });

  it('exposes font mappings used by interactive SVG elements', () => {
    expect(FONT_MAP).toHaveProperty('jetbrains');
    expect(FONT_MAP).toHaveProperty('fira');
    expect(FONT_MAP).toHaveProperty('roboto');
  });

  it('defines contribution milestone values in ascending order', () => {
    const sorted = [...CONTRIBUTION_MILESTONES].sort((a, b) => a - b);

    expect(CONTRIBUTION_MILESTONES).toEqual(sorted);
  });

  it('defines streak milestone values in ascending order', () => {
    const sorted = [...STREAK_MILESTONES].sort((a, b) => a - b);

    expect(STREAK_MILESTONES).toEqual(sorted);
  });

  it('contains milestone values suitable for interactive overlays', () => {
    expect(CONTRIBUTION_MILESTONES.length).toBeGreaterThan(0);
    expect(STREAK_MILESTONES.length).toBeGreaterThan(0);

    expect(CONTRIBUTION_MILESTONES.every((v) => v > 0)).toBe(true);
    expect(STREAK_MILESTONES.every((v) => v > 0)).toBe(true);
  });
});
