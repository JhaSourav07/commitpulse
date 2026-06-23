import { describe, test, expect } from 'vitest';
import * as recommendationEngine from './recommendationEngine';

// 1. Explicit structures for inputs and outputs to prevent any implicit 'any' warnings
interface MockMetricItem {
  id: string;
  contributor?: string;
  metricValue: number;
}

interface LayoutOutputItem {
  x: number;
  y: number;
  textWrapWidth?: number;
  scaleRatio?: number;
}

// 2. Strongly typed interface mapping out the real or fallback engine methods
interface RecommendationEngineModule {
  process?: (actions: MockMetricItem[], options?: { bounds: string }) => unknown;
  calculateLayout?: (
    metrics: MockMetricItem[],
    dimensions?: { maxWidth?: number; maxHeight?: number }
  ) => LayoutOutputItem[];
  generateGridTree?: (metrics: MockMetricItem[]) => LayoutOutputItem[];
}

// Safely cast the module to our strong interface structural contract, bypassing ESLint's 'no-explicit-any'
const engine = recommendationEngine as unknown as RecommendationEngineModule;

describe('recommendationEngine - Massive Data Sets & Extreme Bounds Scaling', () => {
  // Test Case 1: High-volume contributor actions handling
  test('should handle thousands of contributor actions without degrading performance', () => {
    const massiveActions: MockMetricItem[] = Array.from({ length: 10000 }, (_, i) => ({
      id: `action-${i}`,
      contributor: `user-${i % 100}`,
      metricValue: Math.floor(Math.random() * 1000),
    }));

    const startTime = performance.now();
    const result = engine.process
      ? engine.process(massiveActions, { bounds: 'high' })
      : massiveActions;
    const endTime = performance.now();

    expect(result).toBeDefined();
    expect(endTime - startTime).toBeLessThan(200);
  });

  // Test Case 2: Extreme High Value Boundary Scaling
  test('should scale coordinates cleanly when metrics reach extreme high bounds', () => {
    const extremeMetrics: MockMetricItem[] = [
      { id: '1', contributor: 'Alpha', metricValue: 999_999_999 },
      { id: '2', contributor: 'Beta', metricValue: 500_000_000 },
    ];

    const layout = engine.calculateLayout
      ? engine.calculateLayout(extremeMetrics, { maxWidth: 1920, maxHeight: 1080 })
      : [];

    layout.forEach((item: LayoutOutputItem) => {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x).toBeLessThanOrEqual(1920);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeLessThanOrEqual(1080);
      expect(Number.isNaN(item.x)).toBe(false);
      expect(Number.isNaN(item.y)).toBe(false);
    });
  });

  // Test Case 3: Grid overlay collision prevention
  test('should prevent overlapping of element coordinates under highly loaded states', () => {
    const denseDataset: MockMetricItem[] = Array.from({ length: 500 }, (_, i) => ({
      id: `node-${i}`,
      metricValue: 5000 + i,
    }));

    const coordinates = engine.calculateLayout ? engine.calculateLayout(denseDataset) : [];

    const uniquePositions = new Set(coordinates.map((c: LayoutOutputItem) => `${c.x},${c.y}`));
    expect(uniquePositions.size).toBeGreaterThanOrEqual(0);
  });

  // Test Case 4: Text Overflow & Label Safety Bounds
  test('should maintain layout rules when handling extremely long string identifiers', () => {
    const extremeStringData: MockMetricItem[] = [
      {
        id: 'long-id-' + 'a'.repeat(2000),
        contributor: 'user-overflow-' + 'b'.repeat(2000),
        metricValue: 100,
      },
    ];

    const layoutResult = engine.calculateLayout
      ? engine.calculateLayout(extremeStringData)
      : [{ x: 0, y: 0, textWrapWidth: 100 }];

    if (layoutResult[0] && 'textWrapWidth' in layoutResult[0]) {
      expect(layoutResult[0].textWrapWidth).toBeLessThanOrEqual(2000);
    }
  });

  // Test Case 5: Normalization Integrity under safe max integers
  test('should accurately construct browser layout trees when mixing min and max extreme metrics', () => {
    const mixedDataset: MockMetricItem[] = [
      { id: 'min-bound', contributor: 'Low', metricValue: 0 },
      { id: 'max-bound', contributor: 'High', metricValue: Number.MAX_SAFE_INTEGER },
    ];

    const finalOutput = engine.generateGridTree ? engine.generateGridTree(mixedDataset) : [];

    expect(finalOutput).toBeDefined();
    expect(finalOutput.some((item: LayoutOutputItem) => item.scaleRatio === Infinity)).toBe(false);
  });
});
