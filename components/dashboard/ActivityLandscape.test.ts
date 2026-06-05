import { describe, it, expect } from 'vitest';
import { getFilteredData } from './ActivityLandscape';
import { ActivityData } from '@/types/dashboard';

const generateData = (days: number): ActivityData[] => {
  return Array.from({ length: days }, (_, i) => ({
    date: `2024-01-${(i + 1).toString().padStart(2, '0')}`,
    count: i,
    intensity: (i % 5) as 0 | 1 | 2 | 3 | 4,
  }));
};

describe('ActivityLandscape Filtering Logic', () => {
  it('filters 1W correctly (last 7 days)', () => {
    const data = generateData(10);
    const result = getFilteredData(data, '1W');
    expect(result.length).toBe(7);
    expect(result[0].count).toBe(3);
    expect(result[result.length - 1].count).toBe(9);
  });

  it('filters 1M correctly (last 30 days)', () => {
    const data = generateData(40);
    const result = getFilteredData(data, '1M');
    expect(result.length).toBe(30);
    expect(result[0].count).toBe(10);
    expect(result[result.length - 1].count).toBe(39);
  });

  it('filters 3M correctly (last 90 days, downsampled to <=60)', () => {
    const data = generateData(100);
    const result = getFilteredData(data, '3M');
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.length).toBe(45);
    expect(result[0].count).toBe(10);
  });

  it('filters 1Y correctly (last 365 days, downsampled to <=60)', () => {
    const data = generateData(400);
    const result = getFilteredData(data, '1Y');
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.length).toBe(53);
  });

  it('applies downsampling when items exceed 60', () => {
    const data60 = generateData(60);
    const result60 = getFilteredData(data60, '3M');
    expect(result60.length).toBe(60);

    const data61 = generateData(61);
    const result61 = getFilteredData(data61, '3M');
    expect(result61.length).toBeLessThanOrEqual(60);
    expect(result61.length).toBe(31);
  });
});
