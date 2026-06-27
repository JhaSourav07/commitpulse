import { describe, it, expect } from 'vitest';
import { SVG_WIDTH } from './constants';
import {
  GHOST_HEIGHT_PX,
  LOG_SCALE_MULTIPLIER,
  LINEAR_SCALE_MULTIPLIER,
  MAX_LOG_HEIGHT,
  MAX_LINEAR_HEIGHT,
  TILE_WIDTH_HALF,
  TILE_HEIGHT_HALF,
  GRID_ORIGIN_X,
  GRID_ORIGIN_Y,
} from './layoutConstants';

// Active tower must be at least 10x taller than ghost tower for clear visual hierarchy
const MIN_ACTIVE_OVER_GHOST_RATIO = 10;
// Ghost height should consume at most 10% of the max linear height to stay visually subtle
const MAX_GHOST_FRACTION_OF_MAX_LINEAR = 0.1;
// Isometric tile proportions: width must be 1.5x–2x height for proper perspective
const MIN_ISO_ASPECT_RATIO = 1.5;
const MAX_ISO_ASPECT_RATIO = 2;
// Log scale must grow at least 2x faster per count than linear scale for proportionate heights
const MIN_LOG_OVER_LINEAR_RATIO = 2;

describe('Layout constants visual cohesion', () => {
  it('ghost height remains visually subtle relative to max tower height', () => {
    expect(GHOST_HEIGHT_PX).toBeGreaterThan(0);
    expect(GHOST_HEIGHT_PX).toBeLessThan(MAX_LINEAR_HEIGHT * MAX_GHOST_FRACTION_OF_MAX_LINEAR);
  });

  it('active tower max height provides clear visual distinction from ghost towers', () => {
    const linearRatio = MAX_LINEAR_HEIGHT / GHOST_HEIGHT_PX;
    const logRatio = MAX_LOG_HEIGHT / GHOST_HEIGHT_PX;
    expect(linearRatio).toBeGreaterThanOrEqual(MIN_ACTIVE_OVER_GHOST_RATIO);
    expect(logRatio).toBeGreaterThanOrEqual(MIN_ACTIVE_OVER_GHOST_RATIO);
  });

  it('grid origin horizontally centers the isometric layout within the SVG viewport', () => {
    expect(GRID_ORIGIN_X).toBeCloseTo(SVG_WIDTH / 2, 5);
    expect(GRID_ORIGIN_Y).toBeGreaterThan(0);
  });

  it('tile dimensions preserve isometric width-over-height aspect ratio', () => {
    expect(TILE_WIDTH_HALF).toBeGreaterThan(TILE_HEIGHT_HALF);
    const aspectRatio = TILE_WIDTH_HALF / TILE_HEIGHT_HALF;
    expect(aspectRatio).toBeGreaterThan(MIN_ISO_ASPECT_RATIO);
    expect(aspectRatio).toBeLessThan(MAX_ISO_ASPECT_RATIO);
  });

  it('log scale multiplier exceeds linear multiplier for proportionate visual hierarchy', () => {
    expect(LINEAR_SCALE_MULTIPLIER).toBeGreaterThan(0);
    expect(LOG_SCALE_MULTIPLIER / LINEAR_SCALE_MULTIPLIER).toBeGreaterThan(
      MIN_LOG_OVER_LINEAR_RATIO
    );
  });
});
