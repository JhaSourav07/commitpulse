import { describe, it, expect } from 'vitest';
import { getSizeScale } from './generator';
import { SVG_WIDTH } from './generatorConstants';

describe('getSizeScale', () => {
  it('returns the correct scale for "small"', () => {
    expect(getSizeScale('small')).toBe(400 / SVG_WIDTH);
  });

  it('returns the correct scale for "large"', () => {
    expect(getSizeScale('large')).toBe(800 / SVG_WIDTH);
  });

  it('returns 1 for "medium"', () => {
    expect(getSizeScale('medium')).toBe(1);
  });

  it('returns 1 when size is undefined', () => {
    expect(getSizeScale(undefined)).toBe(1);
  });

  it('returns 1 for out-of-bounds or invalid string parameters', () => {
    // @ts-expect-error testing invalid parameter
    expect(getSizeScale('extra-large')).toBe(1);
    // @ts-expect-error testing invalid parameter
    expect(getSizeScale('')).toBe(1);
    // @ts-expect-error testing invalid parameter
    expect(getSizeScale(null)).toBe(1);
  });
});
