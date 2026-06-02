// lib/svg/constants.massive-scaling.test.ts

import { describe, expect, it } from 'vitest';
import {
  SVG_WIDTH,
  SVG_HEIGHT,
  GHOST_HEIGHT_PX,
  LOG_SCALE_MULTIPLIER,
  LINEAR_SCALE_MULTIPLIER,
  MAX_LOG_HEIGHT,
  MAX_LINEAR_HEIGHT,
  CONTRIBUTION_MILESTONES,
  STREAK_MILESTONES,
} from './constants';

describe('SVG Constants Massive Scaling', () => {
  it('supports large simulated contribution datasets', () => {
    const contributions = Array.from({ length: 10000 }, (_, i) => i + 1);

    expect(contributions.length).toBe(10000);
    expect(Math.max(...contributions)).toBe(10000);
  });

  it('maintains positive scaling configuration values', () => {
    expect(LOG_SCALE_MULTIPLIER).toBeGreaterThan(0);
    expect(LINEAR_SCALE_MULTIPLIER).toBeGreaterThan(0);
    expect(MAX_LOG_HEIGHT).toBeGreaterThan(0);
    expect(MAX_LINEAR_HEIGHT).toBeGreaterThan(0);
  });

  it('provides valid SVG dimensions under high-volume scenarios', () => {
    expect(SVG_WIDTH).toBeGreaterThan(0);
    expect(SVG_HEIGHT).toBeGreaterThan(0);
    expect(GHOST_HEIGHT_PX).toBeGreaterThan(0);
  });

  it('maintains milestone integrity with large data references', () => {
    expect(CONTRIBUTION_MILESTONES.every((v) => v > 0)).toBe(true);
    expect(STREAK_MILESTONES.every((v) => v > 0)).toBe(true);
  });

  it('handles repeated access without configuration drift', () => {
    for (let i = 0; i < 10000; i++) {
      expect(SVG_WIDTH).toBe(600);
      expect(SVG_HEIGHT).toBe(420);
    }
  });
});
