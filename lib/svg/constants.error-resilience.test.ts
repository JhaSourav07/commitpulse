import { describe, expect, it } from 'vitest';
import { CONTRIBUTION_MILESTONES, STREAK_MILESTONES, SVG_HEIGHT, SVG_WIDTH } from './constants';
import {
  GHOST_HEIGHT_PX,
  LINEAR_SCALE_MULTIPLIER,
  LOG_SCALE_MULTIPLIER,
  MAX_LINEAR_HEIGHT,
  MAX_LOG_HEIGHT,
} from './layoutConstants';
import { FONT_MAP } from './fonts';

describe('SVG constants error resilience', () => {
  it('provides stable dimensions during hydration', () => {
    expect(SVG_WIDTH).toBeGreaterThan(0);
    expect(SVG_HEIGHT).toBeGreaterThan(0);
  });

  it('provides safe fallback scaling values', () => {
    expect(GHOST_HEIGHT_PX).toBeGreaterThan(0);
    expect(LOG_SCALE_MULTIPLIER).toBeGreaterThan(0);
    expect(LINEAR_SCALE_MULTIPLIER).toBeGreaterThan(0);
    expect(MAX_LOG_HEIGHT).toBeGreaterThan(0);
    expect(MAX_LINEAR_HEIGHT).toBeGreaterThan(0);
  });

  it('provides font fallbacks for rendering recovery', () => {
    expect(FONT_MAP.jetbrains).toContain('monospace');
    expect(FONT_MAP.fira).toContain('monospace');
    expect(FONT_MAP.roboto).toContain('sans-serif');
  });

  it('maintains valid contribution milestone fallback data', () => {
    expect(CONTRIBUTION_MILESTONES.length).toBeGreaterThan(0);
    expect(CONTRIBUTION_MILESTONES.every((v) => v > 0)).toBe(true);
  });

  it('maintains valid streak milestone fallback data', () => {
    expect(STREAK_MILESTONES.length).toBeGreaterThan(0);
    expect(STREAK_MILESTONES.every((v) => v > 0)).toBe(true);
  });
});
