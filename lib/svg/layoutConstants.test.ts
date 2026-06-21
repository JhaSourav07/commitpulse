import { describe, it, expect } from 'vitest';
import {
  GHOST_HEIGHT_PX,
  LOG_SCALE_MULTIPLIER,
  LINEAR_SCALE_MULTIPLIER,
  MAX_LOG_HEIGHT,
  MAX_LINEAR_HEIGHT,
} from './layoutConstants';

describe('layoutConstants', () => {
  it('GHOST_HEIGHT_PX equals 4', () => {
    expect(GHOST_HEIGHT_PX).toBe(4);
  });

  it('LOG_SCALE_MULTIPLIER equals 15', () => {
    expect(LOG_SCALE_MULTIPLIER).toBe(15);
  });

  it('LINEAR_SCALE_MULTIPLIER equals 5', () => {
    expect(LINEAR_SCALE_MULTIPLIER).toBe(5);
  });

  it('MAX_LOG_HEIGHT equals 50', () => {
    expect(MAX_LOG_HEIGHT).toBe(50);
  });

  it('MAX_LINEAR_HEIGHT equals 50', () => {
    expect(MAX_LINEAR_HEIGHT).toBe(50);
  });
});
