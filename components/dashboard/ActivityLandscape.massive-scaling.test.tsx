import { describe, it, expect } from 'vitest';
import { getFilteredData } from './ActivityLandscape';
import type { ActivityData } from '@/types/dashboard';

const generateData = (count: number): ActivityData[] =>
  Array.from({ length: count }, (_, i) => ({
    date: new Date(Date.now() - (count - i) * 86400000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * 100),
    intensity: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
    locAdditions: Math.floor(Math.random() * 500),
    locDeletions: Math.floor(Math.random() * 200),
  }));

describe('ActivityLandscape – Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('handles 10,000 data points without crashing', () => {
    const data = generateData(10000);
    const result = getFilteredData(data, '1Y');
    expect(result.length).toBeLessThanOrEqual(60);
  });

  it('downsamples massive datasets to max 60 bars', () => {
    const data = generateData(5000);
    const result = getFilteredData(data, '3M');
    expect(result.length).toBeLessThanOrEqual(60);
  });

  it('handles extreme high commit counts', () => {
    const data: ActivityData[] = Array.from({ length: 365 }, (_, i) => ({
      date: new Date(Date.now() - (365 - i) * 86400000).toISOString().split('T')[0],
      count: 999999,
      intensity: 4,
      locAdditions: 999999,
      locDeletions: 999999,
    }));
    const result = getFilteredData(data, '1Y');
    expect(result.every((d) => d.count === 999999)).toBe(true);
  });

  it('returns correct slice for 1W tab with large dataset', () => {
    const data = generateData(10000);
    const result = getFilteredData(data, '1W');
    expect(result.length).toBeLessThanOrEqual(7);
  });

  it('returns correct slice for 1M tab with large dataset', () => {
    const data = generateData(10000);
    const result = getFilteredData(data, '1M');
    expect(result.length).toBeLessThanOrEqual(30);
  });

  it('handles empty data array gracefully', () => {
    const result = getFilteredData([], '1Y');
    expect(result).toEqual([]);
  });

  it('handles single data point', () => {
    const data = generateData(1);
    const result = getFilteredData(data, '1Y');
    expect(result.length).toBe(1);
  });

  it('handles data with all zero counts', () => {
    const data: ActivityData[] = Array.from({ length: 1000 }, (_, i) => ({
      date: new Date(Date.now() - (1000 - i) * 86400000).toISOString().split('T')[0],
      count: 0,
      intensity: 0,
      locAdditions: 0,
      locDeletions: 0,
    }));
    const result = getFilteredData(data, '3M');
    expect(result.every((d) => d.count === 0)).toBe(true);
  });
});
