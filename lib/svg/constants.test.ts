import { describe, it, expect } from 'vitest';
import {
  SVG_WIDTH,
  SVG_HEIGHT,
  GHOST_HEIGHT_PX,
  LOG_SCALE_MULTIPLIER,
  LINEAR_SCALE_MULTIPLIER,
  MAX_LOG_HEIGHT,
  MAX_LINEAR_HEIGHT,
  FONT_MAP,
  CONTRIBUTION_MILESTONES,
  STREAK_MILESTONES,
} from './constants';

describe('svg constants', () => {
  it('exports positive SVG dimensions', () => {
    expect(SVG_WIDTH).toBeGreaterThan(0);
    expect(SVG_HEIGHT).toBeGreaterThan(0);
    expect(Number.isInteger(SVG_WIDTH)).toBe(true);
    expect(Number.isInteger(SVG_HEIGHT)).toBe(true);
  });

  it('exports valid scaling and height values', () => {
    expect(GHOST_HEIGHT_PX).toBeGreaterThan(0);

    expect(LOG_SCALE_MULTIPLIER).toBeGreaterThan(0);
    expect(LINEAR_SCALE_MULTIPLIER).toBeGreaterThan(0);

    expect(MAX_LOG_HEIGHT).toBeGreaterThan(0);
    expect(MAX_LINEAR_HEIGHT).toBeGreaterThan(0);

    expect(MAX_LOG_HEIGHT).toBeLessThanOrEqual(SVG_HEIGHT);
    expect(MAX_LINEAR_HEIGHT).toBeLessThanOrEqual(SVG_HEIGHT);
  });

  it('exports valid font mappings', () => {
    expect(Object.keys(FONT_MAP)).toEqual(['jetbrains', 'fira', 'roboto']);

    Object.values(FONT_MAP).forEach((font) => {
      expect(typeof font).toBe('string');
      expect(font.length).toBeGreaterThan(0);
    });
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

    expect(GHOST_HEIGHT_PX).toBe(4);
    expect(LOG_SCALE_MULTIPLIER).toBe(12);
    expect(LINEAR_SCALE_MULTIPLIER).toBe(5);

    expect(MAX_LOG_HEIGHT).toBe(80);
    expect(MAX_LINEAR_HEIGHT).toBe(50);
  });
});
