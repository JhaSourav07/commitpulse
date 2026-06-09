import { describe, expect, it } from 'vitest';
import { SVG_WIDTH, SVG_HEIGHT, CONTRIBUTION_MILESTONES, STREAK_MILESTONES } from './constants';
import {
  GHOST_HEIGHT_PX,
  LOG_SCALE_MULTIPLIER,
  LINEAR_SCALE_MULTIPLIER,
  MAX_LOG_HEIGHT,
  MAX_LINEAR_HEIGHT,
} from './layoutConstants';
import { FONT_MAP } from './fonts';

describe('lib/svg/constants', () => {
  it('should expose expected SVG dimensions', () => {
    expect(SVG_WIDTH).toBe(600);
    expect(SVG_HEIGHT).toBe(420);
  });

  it('should expose expected rendering scale constants', () => {
    expect(GHOST_HEIGHT_PX).toBe(4);
    expect(LOG_SCALE_MULTIPLIER).toBe(12);
    expect(LINEAR_SCALE_MULTIPLIER).toBe(5);
    expect(MAX_LOG_HEIGHT).toBe(80);
    expect(MAX_LINEAR_HEIGHT).toBe(50);
  });

  it('should expose correct font mappings', () => {
    expect(FONT_MAP).toEqual({
      jetbrains: '"JetBrains Mono", monospace',
      fira: '"Fira Code", monospace',
      roboto: '"Roboto", sans-serif',
      syncopate: '"Syncopate", sans-serif',
      spacegrotesk: '"Space Grotesk", sans-serif',
      'space grotesk': '"Space Grotesk", sans-serif',
      firacode: '"Fira Code", monospace',
      'jetbrains mono': '"JetBrains Mono", monospace',
    });
  });

  it('should expose expected contribution milestones', () => {
    expect(CONTRIBUTION_MILESTONES).toEqual([1, 10, 100, 250, 500, 1000]);
  });

  it('should expose expected streak milestones', () => {
    expect(STREAK_MILESTONES).toEqual([3, 7, 30, 100]);
  });
});
