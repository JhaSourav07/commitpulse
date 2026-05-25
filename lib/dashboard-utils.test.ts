import { describe, it, expect } from 'vitest';
import { getFilteredActivityData } from './dashboard-utils';
import { ActivityData } from '@/types/dashboard';

describe('getFilteredActivityData', () => {
  // Helper to create mock data
  const createMockData = (count: number): ActivityData[] => {
    return Array.from({ length: count }, (_, i) => ({
      date: `2024-01-${(i % 28) + 1}`,
      count: i + 1,
      intensity: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
    }));
  };

  it('should return last 7 days for "1W" tab when data is sufficient', () => {
    const data = createMockData(20);
    const result = getFilteredActivityData(data, '1W');
    expect(result.length).toBe(7);
  });

  it('should return last 30 days for "1M" tab when data is sufficient', () => {
    const data = createMockData(40);
    const result = getFilteredActivityData(data, '1M');
    expect(result.length).toBe(30);
  });

  it('should return last 90 days for "3M" tab when data is sufficient and below 60 limit', () => {
    // To avoid downsampling, we provide exactly 50 items for a 90-day request
    const data = createMockData(50);
    const result = getFilteredActivityData(data, '3M');
    expect(result.length).toBe(50);
  });

  it('should return last 365 days for "1Y" tab when data is sufficient and below 60 limit', () => {
    // To avoid downsampling, we provide 55 items for a 365-day request
    const data = createMockData(55);
    const result = getFilteredActivityData(data, '1Y');
    expect(result.length).toBe(55);
  });

  it('should apply downsampling if data exceeds 60 items', () => {
    // Use '1Y' tab to ensure the window (365 days) is larger than our 120 items,
    // so the slice(-days) doesn't reduce our input before downsampling.
    const data = createMockData(120);
    const result = getFilteredActivityData(data, '1Y');
    expect(result.length).toBe(60);
  });

  it('should handle empty data gracefully', () => {
    const data: ActivityData[] = [];
    const result = getFilteredActivityData(data, '1W');
    expect(result).toEqual([]);
  });

  it('should return all items if count is less than 60 and less than requested days', () => {
    const data = createMockData(45);
    const result = getFilteredActivityData(data, '1Y');
    expect(result.length).toBe(45);
  });
});
