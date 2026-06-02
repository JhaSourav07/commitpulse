import { describe, expect, it } from 'vitest';
import {
  CONTRIBUTION_MILESTONES,
  FONT_MAP,
  GHOST_HEIGHT_PX,
  LINEAR_SCALE_MULTIPLIER,
  LOG_SCALE_MULTIPLIER,
  MAX_LINEAR_HEIGHT,
  MAX_LOG_HEIGHT,
  STREAK_MILESTONES,
  SVG_HEIGHT,
  SVG_WIDTH,
} from './constants';

describe('SVG constants empty fallback behavior', () => {
  it('provides positive fallback SVG dimensions', () => {
    expect(SVG_WIDTH).toBeGreaterThan(0);
    expect(SVG_HEIGHT).toBeGreaterThan(0);
  });

  it('provides safe fallback scaling constants', () => {
    expect(GHOST_HEIGHT_PX).toBeGreaterThan(0);
    expect(LOG_SCALE_MULTIPLIER).toBeGreaterThan(0);
    expect(LINEAR_SCALE_MULTIPLIER).toBeGreaterThan(0);
  });

  it('provides maximum height bounds for scaled SVG elements', () => {
    expect(MAX_LOG_HEIGHT).toBeGreaterThan(0);
    expect(MAX_LINEAR_HEIGHT).toBeGreaterThan(0);
  });

  it('provides default font fallbacks when no custom font is selected', () => {
    expect(Object.keys(FONT_MAP).length).toBeGreaterThan(0);
    expect(FONT_MAP.jetbrains).toContain('monospace');
    expect(FONT_MAP.fira).toContain('monospace');
    expect(FONT_MAP.roboto).toContain('sans-serif');
  });

  it('provides non-empty milestone fallback arrays', () => {
    expect(CONTRIBUTION_MILESTONES.length).toBeGreaterThan(0);
    expect(STREAK_MILESTONES.length).toBeGreaterThan(0);
    expect(CONTRIBUTION_MILESTONES.every((value) => value > 0)).toBe(true);
    expect(STREAK_MILESTONES.every((value) => value > 0)).toBe(true);
  });
});
