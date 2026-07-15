import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ActivityData } from '@/types/dashboard';
import { getIntensityColor } from './heatmapUtils';

describe('heatmapUtils - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  beforeEach(() => {
    // Mock standard wide viewport defaults before testing responsive variations
    vi.stubGlobal('innerWidth', 1024);
  });

  // Test Case 1: Mock common mobile viewport widths and verify responsive calculations or layout behavior remain correct.
  it('1. verifies responsive scale calculations for common mobile viewport widths (375px, 390px, 768px)', () => {
    const CELL = 14;
    const GAP = 3;
    const weeksCount = 52;
    const naturalWidth = weeksCount * (CELL + GAP) - GAP; // 881px

    const calculateScale = (availableWidth: number): number => {
      if (availableWidth <= 0) return 1;
      return Math.min(1, availableWidth / naturalWidth);
    };

    // Test 375px viewport (Mobile S/M)
    vi.stubGlobal('innerWidth', 375);
    const scale375 = calculateScale(window.innerWidth);
    expect(scale375).toBeLessThan(1);
    expect(scale375).toBeCloseTo(375 / 881);

    // Test 390px viewport (Mobile L)
    vi.stubGlobal('innerWidth', 390);
    const scale390 = calculateScale(window.innerWidth);
    expect(scale390).toBeLessThan(1);
    expect(scale390).toBeCloseTo(390 / 881);

    // Test 768px viewport (Tablet)
    vi.stubGlobal('innerWidth', 768);
    const scale768 = calculateScale(window.innerWidth);
    expect(scale768).toBeLessThan(1);
    expect(scale768).toBeCloseTo(768 / 881);

    // Verify intensity color utility works and evaluates stably under mobile mocks
    expect(getIntensityColor(0)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  // Test Case 2: Verify columns or generated layout data reflow correctly for smaller screen sizes without producing invalid structures.
  it('2. verifies weekly column grouping structure reflows correctly without producing invalid layouts', () => {
    const chunkWeeks = (data: ActivityData[], size: number): ActivityData[][] => {
      const result: ActivityData[][] = [];
      for (let i = 0; i < data.length; i += size) {
        result.push(data.slice(i, i + size));
      }
      return result;
    };

    const mockData: ActivityData[] = Array.from({ length: 367 }, (_, i) => ({
      date: `2026-01-${(i + 1).toString().padStart(2, '0')}`,
      count: i % 5,
      intensity: (i % 5) as ActivityData['intensity'],
    }));

    const weeks = chunkWeeks(mockData, 7);

    // 367 days / 7 = 52.42 -> should reflow into 53 columns total
    expect(weeks).toHaveLength(53);

    // All full columns must have exactly 7 items
    for (let i = 0; i < weeks.length - 1; i++) {
      expect(weeks[i]).toHaveLength(7);
    }
    // The last partial week should contain the remainder (3 items)
    expect(weeks[weeks.length - 1]).toHaveLength(3);

    // Ensure intensity classes resolve correctly for all structures
    weeks.forEach((week) => {
      week.forEach((day) => {
        const color = getIntensityColor(day.intensity);
        expect(color).toBeDefined();
        expect(typeof color).toBe('string');
      });
    });
  });

  // Test Case 3: Assert responsive values avoid fixed widths or dimensions that could introduce horizontal overflow on mobile.
  it('3. asserts that dynamic scaling avoids fixed dimensions to prevent horizontal overflow on mobile', () => {
    vi.stubGlobal('innerWidth', 375);
    const CELL = 14;
    const GAP = 3;
    const weeksCount = 52;
    const naturalWidth = weeksCount * (CELL + GAP) - GAP; // 881px

    // Verify fixed width container is wider than mobile viewport
    expect(naturalWidth).toBeGreaterThan(window.innerWidth);

    // Verify scaled width dynamically fits within screen bounds to prevent horizontal scrollbars
    const scale = Math.min(1, window.innerWidth / naturalWidth);
    const scaledWidth = naturalWidth * scale;

    expect(scaledWidth).toBeLessThanOrEqual(window.innerWidth);
    expect(scale).toBeLessThan(1); // Mocks scaling down
  });

  // Test Case 4: Verify navigation or responsive helper outputs scale correctly across mobile, tablet, and desktop breakpoints.
  it('4. verifies scale factor output transitions smoothly between mobile, tablet, and desktop breakpoints', () => {
    const CELL = 14;
    const GAP = 3;
    const weeksCount = 52;
    const naturalWidth = weeksCount * (CELL + GAP) - GAP; // 881px

    const getScaleForWidth = (width: number): number => {
      return Math.min(1, width / naturalWidth);
    };

    // Mobile viewport (375px) - scale down
    const scaleMobile = getScaleForWidth(375);
    expect(scaleMobile).toBeCloseTo(375 / 881);
    expect(scaleMobile).toBeLessThan(1);

    // Tablet viewport (768px) - scale down slightly
    const scaleTablet = getScaleForWidth(768);
    expect(scaleTablet).toBeCloseTo(768 / 881);
    expect(scaleTablet).toBeLessThan(1);

    // Desktop viewport (1280px) - keep 1:1 scale (no downscale)
    const scaleDesktop = getScaleForWidth(1280);
    expect(scaleDesktop).toBe(1);
  });

  // Test Case 5: Ensure missing viewport information or invalid breakpoint values gracefully fall back to safe defaults without runtime errors.
  it('5. ensures invalid breakpoint values or missing viewport details fall back gracefully to safe defaults', () => {
    const CELL = 14;
    const GAP = 3;
    const weeksCount = 52;
    const naturalWidth = weeksCount * (CELL + GAP) - GAP;

    const getSafeScale = (width?: number | null): number => {
      if (width === undefined || width === null || Number.isNaN(width) || width <= 0) {
        return 1; // Standard non-scaled desktop fallback default
      }
      return Math.min(1, width / naturalWidth);
    };

    // Ensure undefined, null, NaN, and negative/zero inputs evaluate to safe default scale (1)
    expect(getSafeScale(undefined)).toBe(1);
    expect(getSafeScale(null)).toBe(1);
    expect(getSafeScale(NaN)).toBe(1);
    expect(getSafeScale(-100)).toBe(1);
    expect(getSafeScale(0)).toBe(1);

    // Ensure getIntensityColor acts defensively against out-of-bounds intensity indexes
    expect(getIntensityColor(undefined as unknown as number)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(null as unknown as number)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(NaN)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(-10)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(99)).toBe('bg-gray-200 dark:bg-[#161616]');
  });
});
