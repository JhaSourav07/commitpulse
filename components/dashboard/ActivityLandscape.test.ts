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

  it('filters 3M correctly (last 90 days, aggregated to <=60)', () => {
    const data = generateData(100);
    const result = getFilteredData(data, '3M');
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.length).toBe(45);
    // The last 90 days are counts 10..99 bucketed in pairs (step 2); the first bar sums 10 + 11.
    expect(result[0].count).toBe(21);
  });

  it('aggregates buckets by summing days rather than dropping them', () => {
    const data = generateData(100);
    const recentTotal = data.slice(-90).reduce((sum, d) => sum + d.count, 0);
    const result = getFilteredData(data, '3M');
    const bucketedTotal = result.reduce((sum, d) => sum + d.count, 0);

    // Bucketing preserves the full window total, unlike the old every-Nth-day sampling.
    expect(bucketedTotal).toBe(recentTotal);
    // A simple every-Nth-day sample of 45 of 90 days would total far less than the full window.
    expect(bucketedTotal).toBeGreaterThan(recentTotal / 2);
  });

  it('filters 1Y correctly (last 365 days, downsampled to <=60)', () => {
    const data = generateData(400);
    const result = getFilteredData(data, '1Y');
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.length).toBe(53);
  });

  it('places the partial bucket at the oldest edge and keeps recent bars as full windows', () => {
    const data = generateData(61); // counts 0..60; 3M -> step 2, remainder 1 -> 31 buckets
    const result = getFilteredData(data, '3M');
    expect(result.length).toBe(31);
    // The leftover oldest day stays its own bar instead of being merged into a full window.
    expect(result[0].count).toBe(0);
    // The most recent bar sums the last two days (59 + 60).
    expect(result[result.length - 1].count).toBe(59 + 60);
  });

  it('records each aggregated bucket span (startDate and days)', () => {
    const data = generateData(61); // 3M -> step 2, remainder 1
    const result = getFilteredData(data, '3M');
    // The partial oldest bucket spans a single day.
    expect(result[0].startDate).toBe('2024-01-01');
    expect(result[0].days).toBe(1);
    // The next bucket aggregates two days.
    expect(result[1].startDate).toBe('2024-01-02');
    expect(result[1].date).toBe('2024-01-03');
    expect(result[1].days).toBe(2);

    // Non-downsampled views keep raw single days without a span.
    const small = getFilteredData(generateData(10), '1W');
    expect(small[0].startDate).toBeUndefined();
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
