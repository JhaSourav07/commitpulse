import { describe, expect, it } from 'vitest';
import { generateMonolithSTL } from './export3d';
import type { TowerData } from './svg/layout';

describe('generateMonolithSTL - Accessibility compliance', () => {
  it('returns a valid STL string', () => {
    const result = generateMonolithSTL([
      {
        row: 0,
        col: 0,
        h: 5,
      },
    ] as TowerData[]);

    expect(typeof result).toBe('string');
    expect(result).toContain('solid commitpulse_monolith');
    expect(result).toContain('endsolid commitpulse_monolith');
  });

  it('generates human-readable ASCII output', () => {
    const result = generateMonolithSTL([
      {
        row: 1,
        col: 1,
        h: 10,
      },
    ] as TowerData[]);

    expect(result).toContain('facet normal');
    expect(result).toContain('vertex');
    expect(result).not.toContain('\0');
  });

  it('maintains opening and closing STL markers', () => {
    const result = generateMonolithSTL([]);

    expect(result.startsWith('solid commitpulse_monolith')).toBe(true);
    expect(result.trim().endsWith('endsolid commitpulse_monolith')).toBe(true);
  });

  it('handles empty tower data gracefully', () => {
    const result = generateMonolithSTL([]);

    expect(result).toBeTruthy();
    expect(result).toContain('solid commitpulse_monolith');
  });

  it('can be consumed as plain text output', () => {
    const result = generateMonolithSTL([
      {
        row: 2,
        col: 2,
        h: 8,
      },
    ] as TowerData[]);

    expect(() => result.toString()).not.toThrow();
    expect(typeof result.toString()).toBe('string');
  });
});
