import { describe, expect, it } from 'vitest';

import { SVG_WIDTH } from './generatorConstants';
import { getSizeScale } from './generator';

describe('getSizeScale', () => {
  it('returns small scale factor for size=small', () => {
    expect(getSizeScale('small')).toBe(400 / SVG_WIDTH);
  });

  it('returns default scale factor for size=medium', () => {
    expect(getSizeScale('medium')).toBe(1);
  });

  it('returns large scale factor for size=large', () => {
    expect(getSizeScale('large')).toBe(800 / SVG_WIDTH);
  });

  it('returns default scale factor when size is undefined', () => {
    expect(getSizeScale()).toBe(1);
  });

  it('falls back to default scale factor for unknown values', () => {
    expect(getSizeScale('' as unknown as 'small')).toBe(1);
    expect(getSizeScale('xlarge' as unknown as 'small')).toBe(1);
  });
});
