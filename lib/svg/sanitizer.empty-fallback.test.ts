import { describe, it, expect } from 'vitest';
import { normalizeHexColor, getGradientCoordinates } from './sanitizer';

describe('sanitizer empty and missing inputs', () => {
  it('normalizeHexColor returns null for empty and whitespace-only strings', () => {
    expect(normalizeHexColor('')).toBeNull();
    expect(normalizeHexColor('   ')).toBeNull();
    expect(normalizeHexColor('\t')).toBeNull();
  });

  it('normalizeHexColor returns null for strings with only special characters', () => {
    expect(normalizeHexColor('#')).toBeNull();
    expect(normalizeHexColor('##')).toBeNull();
    expect(normalizeHexColor('!@#$%')).toBeNull();
  });

  it('getGradientCoordinates defaults to vertical when direction is undefined', () => {
    const coords = getGradientCoordinates(undefined);
    expect(coords).toEqual({ x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
  });

  it('getGradientCoordinates defaults to vertical for empty or whitespace strings', () => {
    expect(getGradientCoordinates('')).toEqual({ x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
    expect(getGradientCoordinates('   ')).toEqual({ x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
  });

  it('getGradientCoordinates defaults to vertical for unrecognized direction values', () => {
    expect(getGradientCoordinates('invalid')).toEqual({ x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
    expect(getGradientCoordinates('sideways')).toEqual({
      x1: '0%',
      y1: '0%',
      x2: '0%',
      y2: '100%',
    });
  });
});
