// lib/svg/constants.accessibility.test.ts

import { describe, expect, it } from 'vitest';
import { SVG_WIDTH, SVG_HEIGHT, CONTRIBUTION_MILESTONES, STREAK_MILESTONES } from './constants';
import { FONT_MAP } from './fonts';

describe('SVG Constants Accessibility', () => {
  it('provides valid SVG dimensions for accessible rendering', () => {
    expect(SVG_WIDTH).toBeGreaterThan(0);
    expect(SVG_HEIGHT).toBeGreaterThan(0);
  });

  it('exposes readable font mappings for SVG text content', () => {
    expect(FONT_MAP).toHaveProperty('jetbrains');
    expect(FONT_MAP).toHaveProperty('fira');
    expect(FONT_MAP).toHaveProperty('roboto');

    Object.values(FONT_MAP).forEach((font) => {
      expect(typeof font).toBe('string');
      expect(font.length).toBeGreaterThan(0);
    });
  });

  it('defines contribution milestone values suitable for accessible labels', () => {
    expect(CONTRIBUTION_MILESTONES.length).toBeGreaterThan(0);

    CONTRIBUTION_MILESTONES.forEach((value) => {
      expect(value).toBeGreaterThan(0);
    });
  });

  it('defines streak milestone values suitable for accessible labels', () => {
    expect(STREAK_MILESTONES.length).toBeGreaterThan(0);

    STREAK_MILESTONES.forEach((value) => {
      expect(value).toBeGreaterThan(0);
    });
  });

  it('maintains ascending milestone ordering for predictable narration', () => {
    expect(CONTRIBUTION_MILESTONES).toEqual([...CONTRIBUTION_MILESTONES].sort((a, b) => a - b));

    expect(STREAK_MILESTONES).toEqual([...STREAK_MILESTONES].sort((a, b) => a - b));
  });
});
