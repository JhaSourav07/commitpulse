import { describe, expect, it } from 'vitest';
import { buildMiniChart } from './StatsCard';

describe('buildMiniChart', () => {
  it('produces deterministic output for the same seed', () => {
    const first = buildMiniChart(10);
    const second = buildMiniChart(10);

    expect(first).toEqual(second);
  });

  it('returns exactly 12 values', () => {
    const result = buildMiniChart(10);

    expect(result).toHaveLength(12);
  });

  it('returns only positive values', () => {
    const result = buildMiniChart(10);

    result.forEach((value) => {
      expect(value).toBeGreaterThan(0);
    });
  });
});
