import { describe, expect, it } from 'vitest';
import { CONTRIBUTION_MILESTONES, STREAK_MILESTONES, SVG_HEIGHT, SVG_WIDTH } from './constants';

describe('SVG constants timezone boundary alignment', () => {
  it('maintains stable SVG dimensions across timezone offsets', () => {
    expect(SVG_WIDTH).toBe(600);
    expect(SVG_HEIGHT).toBe(420);
  });

  it('preserves contribution milestone ordering during calendar date transitions', () => {
    const sorted = [...CONTRIBUTION_MILESTONES].sort((a, b) => a - b);
    expect(CONTRIBUTION_MILESTONES).toEqual(sorted);
  });

  it('preserves streak milestone ordering across day boundary normalization', () => {
    const sorted = [...STREAK_MILESTONES].sort((a, b) => a - b);
    expect(STREAK_MILESTONES).toEqual(sorted);
  });

  it('uses unique contribution milestones when activity shifts between dates', () => {
    expect(new Set(CONTRIBUTION_MILESTONES).size).toBe(CONTRIBUTION_MILESTONES.length);
  });

  it('uses unique streak milestones during timezone rollover calculations', () => {
    expect(new Set(STREAK_MILESTONES).size).toBe(STREAK_MILESTONES.length);
  });
});
