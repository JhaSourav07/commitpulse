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

import { describe, it, expect } from 'vitest';

describe('SVG constants integrity', () => {
  it('should have valid SVG dimensions', () => {
    expect(SVG_WIDTH).toBe(600);
    expect(SVG_HEIGHT).toBe(420);
  });
  it('should keep ghost height within safe rendering range', () => {
    expect(GHOST_HEIGHT_PX).toBeGreaterThan(0);
    expect(GHOST_HEIGHT_PX).toBeLessThan(10);
  });
  it('should ensure log scale multiplier is larger than linear scale multiplier', () => {
    expect(LOG_SCALE_MULTIPLIER).toBeGreaterThan(LINEAR_SCALE_MULTIPLIER);
    expect(LINEAR_SCALE_MULTIPLIER).toBeGreaterThan(0);
  });
  it('should contain valid font mappings', () => {
    expect(FONT_MAP.jetbrains).toContain('monospace');
    expect(FONT_MAP.fira).toContain('monospace');
    expect(FONT_MAP.roboto).toContain('sans-serif');

    expect(Object.keys(FONT_MAP).length).toBeGreaterThan(0);
  });
  it('should have correctly ordered contribution milestones', () => {
    expect(CONTRIBUTION_MILESTONES).toEqual([...CONTRIBUTION_MILESTONES].sort((a, b) => a - b));

    expect(CONTRIBUTION_MILESTONES[0]).toBe(1);
  });
  it('should have valid streak milestones in ascending order', () => {
    expect(STREAK_MILESTONES).toEqual([...STREAK_MILESTONES].sort((a, b) => a - b));

    expect(STREAK_MILESTONES[0]).toBe(3);
  });
});
