import { describe, expect, it } from 'vitest';
import { CONTRIBUTION_MILESTONES, STREAK_MILESTONES, SVG_HEIGHT, SVG_WIDTH } from './constants';

describe('SVG constants responsive breakpoint behavior', () => {
  it('maintains positive SVG dimensions for mobile viewports', () => {
    expect(SVG_WIDTH).toBeGreaterThan(0);
    expect(SVG_HEIGHT).toBeGreaterThan(0);
  });

  it('preserves aspect ratio across responsive screen sizes', () => {
    const aspectRatio = SVG_WIDTH / SVG_HEIGHT;

    expect(aspectRatio).toBeGreaterThan(1);
  });

  it('provides milestone arrays suitable for multi-device rendering', () => {
    expect(CONTRIBUTION_MILESTONES.length).toBeGreaterThan(0);
    expect(STREAK_MILESTONES.length).toBeGreaterThan(0);
  });

  it('keeps contribution milestones ordered for column layout rendering', () => {
    const sorted = [...CONTRIBUTION_MILESTONES].sort((a, b) => a - b);

    expect(CONTRIBUTION_MILESTONES).toEqual(sorted);
  });

  it('keeps streak milestones ordered for responsive grid rendering', () => {
    const sorted = [...STREAK_MILESTONES].sort((a, b) => a - b);

    expect(STREAK_MILESTONES).toEqual(sorted);
  });
});
