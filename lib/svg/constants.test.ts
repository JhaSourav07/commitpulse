import { describe, it, expect } from 'vitest';
import { SVG_WIDTH, SVG_HEIGHT, CONTRIBUTION_MILESTONES, STREAK_MILESTONES } from './constants';

describe('svg constants', () => {
  it('exports positive SVG dimensions', () => {
    expect(SVG_WIDTH).toBeGreaterThan(0);
    expect(SVG_HEIGHT).toBeGreaterThan(0);
    expect(Number.isInteger(SVG_WIDTH)).toBe(true);
    expect(Number.isInteger(SVG_HEIGHT)).toBe(true);
  });

  it('exports sorted milestone arrays', () => {
    expect(CONTRIBUTION_MILESTONES).toEqual([1, 10, 100, 250, 500, 1000]);

    expect(STREAK_MILESTONES).toEqual([3, 7, 30, 100]);

    expect([...CONTRIBUTION_MILESTONES].sort((a, b) => a - b)).toEqual(CONTRIBUTION_MILESTONES);

    expect([...STREAK_MILESTONES].sort((a, b) => a - b)).toEqual(STREAK_MILESTONES);
  });

  it('matches expected constant configuration', () => {
    expect(SVG_WIDTH).toBe(600);
    expect(SVG_HEIGHT).toBe(420);
  });
});
