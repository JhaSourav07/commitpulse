import { describe, expect, it } from 'vitest';
import { buildTowerPaths, type TowerPaths } from './generator';

const expectedTowerPaths = (h: number, scale = 1): TowerPaths => {
  const tileHalfWidth = 16 * scale;
  const tileHalfHeight = 10 * scale;
  const tileFullHeight = 20 * scale;

  return {
    left: `M0 ${tileHalfHeight - h} L0 ${tileHalfHeight} L-${tileHalfWidth} 0 L-${tileHalfWidth} ${-h} Z`,
    right: `M0 ${tileHalfHeight - h} L0 ${tileHalfHeight} L${tileHalfWidth} 0 L${tileHalfWidth} ${-h} Z`,
    top: `M0 ${-h} L${tileHalfWidth} ${tileHalfHeight - h} L0 ${tileFullHeight - h} L-${tileHalfWidth} ${tileHalfHeight - h} Z`,
  };
};

const extractNumbers = (path: string): number[] =>
  path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];

describe('buildTowerPaths', () => {
  it('returns exact paths for standard and scaled tower geometry', () => {
    expect(buildTowerPaths(15, 1)).toEqual({
      left: 'M0 -5 L0 10 L-16 0 L-16 -15 Z',
      right: 'M0 -5 L0 10 L16 0 L16 -15 Z',
      top: 'M0 -15 L16 -5 L0 5 L-16 -5 Z',
    });

    expect(buildTowerPaths(9, 0.45)).toEqual({
      left: 'M0 -4.5 L0 4.5 L-7.2 0 L-7.2 -9 Z',
      right: 'M0 -4.5 L0 4.5 L7.2 0 L7.2 -9 Z',
      top: 'M0 -9 L7.2 -4.5 L0 0 L-7.2 -4.5 Z',
    });
  });

  it('matches the isometric formula for defaults and out-of-bounds numeric inputs', () => {
    expect(buildTowerPaths(7)).toEqual(expectedTowerPaths(7, 1));
    expect(buildTowerPaths(7, undefined)).toEqual(expectedTowerPaths(7, 1));

    for (const [h, scale] of [
      [0, 1],
      [2.5, 1.25],
      [-5, 1],
      [12, 0],
      [8, -0.5],
      [1000, 3],
    ] as const) {
      expect(buildTowerPaths(h, scale)).toEqual(expectedTowerPaths(h, scale));
    }
  });

  it('handles null, undefined, empty, and non-finite parameters predictably', () => {
    expect(buildTowerPaths(null as unknown as number, 1)).toEqual({
      left: 'M0 10 L0 10 L-16 0 L-16 0 Z',
      right: 'M0 10 L0 10 L16 0 L16 0 Z',
      top: 'M0 0 L16 10 L0 20 L-16 10 Z',
    });

    expect(buildTowerPaths(5, null as unknown as number)).toEqual({
      left: 'M0 -5 L0 0 L-0 0 L-0 -5 Z',
      right: 'M0 -5 L0 0 L0 0 L0 -5 Z',
      top: 'M0 -5 L0 -5 L0 -5 L-0 -5 Z',
    });

    expect(buildTowerPaths('' as unknown as number, '' as unknown as number)).toEqual({
      left: 'M0 0 L0 0 L-0 0 L-0 0 Z',
      right: 'M0 0 L0 0 L0 0 L0 0 Z',
      top: 'M0 0 L0 0 L0 0 L-0 0 Z',
    });

    expect(() => buildTowerPaths(undefined as unknown as number, 1)).not.toThrow();
    expect(buildTowerPaths(undefined as unknown as number, 1)).toEqual({
      left: 'M0 NaN L0 10 L-16 0 L-16 NaN Z',
      right: 'M0 NaN L0 10 L16 0 L16 NaN Z',
      top: 'M0 NaN L16 NaN L0 NaN L-16 NaN Z',
    });

    expect(buildTowerPaths(5, Number.NaN)).toEqual({
      left: 'M0 NaN L0 NaN L-NaN 0 L-NaN -5 Z',
      right: 'M0 NaN L0 NaN LNaN 0 LNaN -5 Z',
      top: 'M0 -5 LNaN NaN L0 NaN L-NaN NaN Z',
    });

    expect(buildTowerPaths(5, Number.POSITIVE_INFINITY)).toEqual({
      left: 'M0 Infinity L0 Infinity L-Infinity 0 L-Infinity -5 Z',
      right: 'M0 Infinity L0 Infinity LInfinity 0 LInfinity -5 Z',
      top: 'M0 -5 LInfinity Infinity L0 Infinity L-Infinity Infinity Z',
    });
  });

  it('conforms to the technical face-alignment specifications', () => {
    const h = 13;
    const scale = 1.5;
    const paths = buildTowerPaths(h, scale);
    const [, leftTopY, , leftBaseY, leftOuterX, leftOuterY, leftOuterTopX, leftOuterTopY] =
      extractNumbers(paths.left);
    const [, rightTopY, , rightBaseY, rightOuterX, rightOuterY, rightOuterTopX, rightOuterTopY] =
      extractNumbers(paths.right);
    const [, topApexY, topRightX, topRightY, , topBottomY, topLeftX, topLeftY] = extractNumbers(
      paths.top
    );

    expect(leftTopY).toBe(10 * scale - h);
    expect(rightTopY).toBe(leftTopY);
    expect(leftBaseY).toBe(10 * scale);
    expect(rightBaseY).toBe(leftBaseY);
    expect(leftOuterX).toBe(-16 * scale);
    expect(leftOuterTopX).toBe(leftOuterX);
    expect(rightOuterX).toBe(16 * scale);
    expect(rightOuterTopX).toBe(rightOuterX);
    expect(leftOuterY).toBe(0);
    expect(rightOuterY).toBe(0);
    expect(leftOuterTopY).toBe(-h);
    expect(rightOuterTopY).toBe(-h);
    expect(topApexY).toBe(-h);
    expect(topRightX).toBe(16 * scale);
    expect(topRightY).toBe(leftTopY);
    expect(topBottomY).toBe(20 * scale - h);
    expect(topLeftX).toBe(-16 * scale);
    expect(topLeftY).toBe(leftTopY);
  });

  it('finishes repeated path generation within standard test timers', { timeout: 1000 }, () => {
    const start = performance.now();

    for (let i = 0; i < 10_000; i += 1) {
      buildTowerPaths(i % 31, 1 + (i % 5) * 0.25);
    }

    expect(performance.now() - start).toBeLessThan(1000);
  });
});
