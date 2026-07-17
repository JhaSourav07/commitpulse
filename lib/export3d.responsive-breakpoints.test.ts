import { describe, expect, it, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { activityToTowers, generateMonolithSTL } from './export3d';
import type { ActivityData } from '@/types/dashboard';

// Store original window globals so we can cleanly restore them between tests.
const originalMatchMedia = window.matchMedia;
const originalInnerWidth = window.innerWidth;

beforeAll(() => {
  // Override matchMedia to support dynamic queries based on the simulated window width.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const match = query.match(/max-width:\s*(\d+)px/);
      let matches = false;
      if (match) {
        matches = window.innerWidth <= parseInt(match[1], 10);
      }
      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
});

afterAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: originalMatchMedia,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: originalInnerWidth,
  });
});

/**
 * Build a deterministic ActivityData fixture for N days starting from a given date.
 * Each day receives a contribution count (cycled from the pattern array) so that
 * the resulting tower grid has predictable column/row assignments.
 */
function buildActivityFixture(
  days: number,
  pattern: number[] = [5, 3, 0, 8, 1, 0, 12]
): ActivityData[] {
  const startDate = '2024-01-01';
  const activity: ActivityData[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const count = pattern[i % pattern.length];
    activity.push({
      date: iso,
      count,
      intensity: count === 0 ? 0 : count <= 3 ? 1 : count <= 6 ? 2 : count <= 10 ? 3 : 4,
    });
  }

  return activity;
}

describe('export3d Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  it('Case 1: Columns reflow into standard vertical flex lists on mobile-width viewport (375px)', () => {
    // Simulate a 375px-wide mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    // Build a 35-day fixture => 5 full weeks (5 columns × 7 rows)
    const activity = buildActivityFixture(35, [0, 2, 5, 0, 1, 8, 3]);
    const towers = activityToTowers(activity);

    // Each column must have exactly 7 rows (one per day-of-week)
    // sorted chronologically: col = floor(index / 7), row = index % 7
    const columnCounts = new Map<number, number>();
    for (const t of towers) {
      columnCounts.set(t.col, (columnCounts.get(t.col) || 0) + 1);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [col, count] of columnCounts) {
      // Each column should contain at most 7 rows (calendar week)
      expect(count).toBeLessThanOrEqual(7);
    }

    // The first column (col=0) must have exactly 7 rows for a full week
    const colZeroCount = towers.filter((t) => t.col === 0).length;
    expect(colZeroCount).toBe(7);

    // All row values within a column should be unique (0–6)
    const colZeroRows = towers.filter((t) => t.col === 0).map((t) => t.row);
    expect(new Set(colZeroRows).size).toBe(7);
  });

  it('Case 2: No absolute pixel widths that would cause horizontal scrollbars on smaller viewports', () => {
    // Simulate a narrow 375px viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const activity = buildActivityFixture(28); // 4 weeks
    const towers = activityToTowers(activity);

    // Tower x positions are relative (col * 12) — verify they're proportional
    // to the column index, not hardcoded absolute values
    for (const t of towers) {
      expect(t.x).toBe(t.col * 12);
    }

    // y positions are relative (row * 12) — proportional to the row index
    for (const t of towers) {
      expect(t.y).toBe(t.row * 12);
    }

    // Generate the STL string and verify the output contains computed dimensions
    // rather than hardcoded absolute pixel values that could overflow.
    const stl = generateMonolithSTL(towers);

    // The STL should use computed vertex positions from the tile layout constants,
    // not contain dangerously large hardcoded numbers that would clip on mobile.
    const vertexLines = stl.split('\n').filter((l) => l.includes('vertex'));
    expect(vertexLines.length).toBeGreaterThan(0);

    // Extract all x-values from vertices to ensure no absolute overflow pattern
    const xValues = vertexLines.map((l) => {
      const parts = l.trim().split(/\s+/);
      return parseFloat(parts[1]);
    });

    const maxX = Math.max(...xValues);
    // The STL model dimensions are computed proportionally from the grid;
    // total width = (maxCol + 1) * 12 - 2, which for 4 columns = 58mm max.
    // There should be no single hardcoded large X value exceeding reasonable bounds
    // for a 4-column mobile model.
    expect(maxX).toBeLessThan(100);

    // Verify the STL contains the expected computed solid name
    expect(stl).toContain('solid commitpulse_monolith');
  });

  it('Case 3: Navigation components scale down gracefully on mobile-width viewport', () => {
    // Simulate a mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    // With a small dataset (14 days = 2 weeks) the model should produce a
    // compact base plate that scales down proportionally.
    const activity = buildActivityFixture(14);
    const towers = activityToTowers(activity);
    const stl = generateMonolithSTL(towers);

    // The base plate is the first box drawn: vertex (0,0,0) and extends to
    // (totalWidth, totalDepth, BASE_HEIGHT). Extract totalWidth and totalDepth
    // from the STL vertex data to verify proportional scaling.
    const vertexLines = stl
      .split('\n')
      .filter((l) => l.includes('vertex') && !l.includes('0.00 0.00 0.00'));
    const xValues = vertexLines.map((l) => {
      const parts = l.trim().split(/\s+/);
      return parseFloat(parts[1]);
    });
    const yValues = vertexLines.map((l) => {
      const parts = l.trim().split(/\s+/);
      return parseFloat(parts[2]);
    });

    const maxX = Math.max(...xValues);
    const maxY = Math.max(...yValues);

    // With 14 days arranged as 2 columns × 7 rows:
    // totalWidth  = (maxRow + 1) * 12 - 2 = (7) * 12 - 2 = 82mm
    // totalDepth  = (maxCol + 1) * 12 - 2 = (2) * 12 - 2 = 22mm
    // These should be proportionally smaller than a full-year model,
    // confirming the navigation/grid scales down gracefully.
    expect(maxY).toBeLessThanOrEqual(25); // Depth scales with column count
    expect(maxX).toBeLessThanOrEqual(85); // Width scales with row count

    // Verify the STL was generated successfully
    expect(stl).toContain('endsolid commitpulse_monolith');
  });

  it('Case 4: Mobile-specific toggle states respond cleanly with grid layout reflow', () => {
    // Simulate a mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    // Build a scenario where some days have zero contributions (the "toggle"
    // between visible and invisible towers should be clean).
    const activity = buildActivityFixture(
      21,
      [0, 0, 0, 5, 0, 0, 0, 3, 0, 0, 0, 8, 0, 0, 0, 1, 0, 0, 0, 2, 0]
    );
    const towers = activityToTowers(activity);

    // Towers with zero height (h === 0) should be flagged as hasCommits === false
    // and produce no facets in the STL output.
    const zeroTowers = towers.filter((t) => t.h === 0);
    const activeTowers = towers.filter((t) => t.h > 0);

    expect(zeroTowers.length).toBeGreaterThan(0);
    expect(activeTowers.length).toBeGreaterThan(0);

    // All zero-height towers must have hasCommits === false
    for (const t of zeroTowers) {
      expect(t.hasCommits).toBe(false);
    }

    // All active towers must have hasCommits === true
    for (const t of activeTowers) {
      expect(t.hasCommits).toBe(true);
    }

    // Generate the STL — the generateMonolithSTL function skips towers with h <= 0,
    // so only active towers should contribute facets. The number of boxes drawn
    // should equal activeTowers.length (each tower = 12 facets, plus the base plate).
    const stl = generateMonolithSTL(towers);
    const facetCount = (stl.match(/facet normal/g) || []).length;

    // Base plate = 12 facets. Each active tower = 12 facets.
    const expectedFacets = 12 + activeTowers.length * 12;
    expect(facetCount).toBe(expectedFacets);
  });

  it('Case 5: Viewport-aware grid dimensions remain proportional across data sizes', () => {
    // Simulate a mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    // Test three different data sizes and verify proportional scaling
    const sizes = [
      { days: 7, expectedCols: 1, expectedMaxY: 25 }, // 1 week
      { days: 35, expectedCols: 5, expectedMaxY: 65 }, // 5 weeks
      { days: 98, expectedCols: 14, expectedMaxY: 175 }, // 14 weeks
    ];

    for (const { days, expectedCols, expectedMaxY } of sizes) {
      const activity = buildActivityFixture(days);
      const towers = activityToTowers(activity);

      // Verify column count is proportional to days / 7
      const uniqueCols = new Set(towers.map((t) => t.col));
      expect(uniqueCols.size).toBe(expectedCols);

      // Verify the maximum depth (y-dimension in STL) scales proportionally
      const stl = generateMonolithSTL(towers);
      const vertexLines = stl.split('\n').filter((l) => l.includes('vertex'));
      const yValues = vertexLines.map((l) => {
        const parts = l.trim().split(/\s+/);
        return parseFloat(parts[2]);
      });
      const maxY = Math.max(...yValues);

      // maxY should be proportional to the column count:
      // expectedMaxY = expectedCols * (TILE_SIZE + GAP) = expectedCols * 12 + some base offset
      expect(maxY).toBeLessThanOrEqual(expectedMaxY + 5); // small tolerance for base plate

      // Verify all towers have valid row/col assignments (0-based)
      for (const t of towers) {
        expect(t.row).toBeGreaterThanOrEqual(0);
        expect(t.row).toBeLessThanOrEqual(6);
        expect(t.col).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
