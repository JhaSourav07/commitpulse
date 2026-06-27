/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

// A mock visualizer component to test integration of useLocalStorage with SVG grid rendering
function ActivityGridVisualizer({ storageKey }: { storageKey: string }) {
  const [activities] = useLocalStorage<any[]>(storageKey, []);

  return React.createElement(
    'div',
    {
      'data-testid': 'visualizer-container',
      style: { width: '800px', height: '600px', overflow: 'hidden' },
    },
    React.createElement(
      'svg',
      {
        'data-testid': 'visualizer-svg',
        width: '100%',
        height: '100%',
        viewBox: '0 0 800 600',
      },
      activities.map((actItem, idx) => {
        // SVG isometric grid layout coordinates calculation
        const col = idx % 50;
        const row = Math.floor(idx / 50);
        const x = col * 15 + 10;
        const y = row * 15 + 10;

        return React.createElement('rect', {
          key: actItem.id,
          'data-testid': `activity-rect-${actItem.id}`,
          x,
          y,
          width: 12,
          height: 12,
          fill: '#10b981',
        });
      })
    )
  );
}

describe('useLocalStorage - Massive Data Sets & High Bounds Scaling', () => {
  const TEST_KEY = 'cp:scaling-activities';

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Massive Dataset Layout Integration & Serialization', () => {
    it('hydrates a massive activities dataset and scales grid coordinates cleanly without crashing', async () => {
      const massiveData: any[] = [];
      for (let i = 0; i < 2000; i++) {
        massiveData.push({
          id: i,
          type: 'push',
          timestamp: '2026-06-12T12:00:00Z',
        });
      }

      localStorage.setItem(TEST_KEY, JSON.stringify(massiveData));

      render(React.createElement(ActivityGridVisualizer, { storageKey: TEST_KEY }));

      // Wait for hook state to hydrate and React to render visual components
      await waitFor(() => {
        const svg = screen.getByTestId('visualizer-svg');
        expect(svg).toBeInTheDocument();
      });

      // Sample first and last grid elements to verify coordinate mapping safety (non-NaN check)
      const rect0 = screen.getByTestId('activity-rect-0');
      const rect1999 = screen.getByTestId('activity-rect-1999');

      expect(rect0).toBeInTheDocument();
      expect(rect1999).toBeInTheDocument();

      const x0 = Number(rect0.getAttribute('x'));
      const y0 = Number(rect0.getAttribute('y'));
      const x1999 = Number(rect1999.getAttribute('x'));
      const y1999 = Number(rect1999.getAttribute('y'));

      expect(isNaN(x0)).toBe(false);
      expect(isNaN(y0)).toBe(false);
      expect(isNaN(x1999)).toBe(false);
      expect(isNaN(y1999)).toBe(false);

      expect(x0).toBeGreaterThanOrEqual(0);
      expect(y0).toBeGreaterThanOrEqual(0);
      expect(x1999).toBeGreaterThan(x0);
      expect(y1999).toBeGreaterThan(y0);
    });

    it('measures execution rendering performance stays below the latency threshold', () => {
      const massiveData: any[] = [];
      for (let i = 0; i < 1500; i++) {
        massiveData.push({
          id: i,
          type: 'push',
          timestamp: '2026-06-12T12:00:00Z',
        });
      }

      localStorage.setItem(TEST_KEY, JSON.stringify(massiveData));

      const startTime = performance.now();

      render(React.createElement(ActivityGridVisualizer, { storageKey: TEST_KEY }));

      const endTime = performance.now();
      const elapsed = endTime - startTime;

      // Layout should compile and render visual representation under 500ms
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('Quota Limit Resilience & State Safety', () => {
    it('gracefully handles QuotaExceededError and updates memory React state cleanly', () => {
      const largePayload = Array.from({ length: 5000 }).map((_, i) => ({
        id: i,
        type: 'commit',
      }));

      // Emulate browser quota exceeded limit error when setting localStorage
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      });

      // Render hook wrapper
      let hookResult: any;
      const TestComponent = () => {
        const [value, setValue] = useLocalStorage<any[]>(TEST_KEY, []);
        React.useEffect(() => {
          hookResult = { value, setValue };
        }, [value, setValue]);
        return React.createElement('div', null);
      };

      render(React.createElement(TestComponent));

      // Attempt to save massive payload under simulated quota limit
      expect(() => {
        act(() => {
          hookResult.setValue(largePayload);
        });
      }).not.toThrow();

      // Hook state should remain updated in memory even if persistent write fails
      expect(hookResult.value).toEqual(largePayload);
    });
  });

  describe('Boundary Keys and High-Frequency Scaling', () => {
    it('supports keys with extreme lengths up to 10,000 characters', () => {
      const longKey = 'k'.repeat(10000);
      const testVal = { ok: true };

      let hookResult: any;
      const TestComponent = () => {
        const [value, setValue] = useLocalStorage<any>(longKey, null);
        React.useEffect(() => {
          hookResult = { value, setValue };
        }, [value, setValue]);
        return React.createElement('div', null);
      };

      render(React.createElement(TestComponent));

      act(() => {
        hookResult.setValue(testVal);
      });

      expect(hookResult.value).toEqual(testVal);
      expect(JSON.parse(localStorage.getItem(longKey)!)).toEqual(testVal);
    });

    it('resolves 1,000 high-frequency sequential updates cleanly to the final value', () => {
      let hookResult: any;
      const TestComponent = () => {
        const [value, setValue] = useLocalStorage<number>(TEST_KEY, 0);
        React.useEffect(() => {
          hookResult = { value, setValue };
        }, [value, setValue]);
        return React.createElement('div', null);
      };

      render(React.createElement(TestComponent));

      act(() => {
        for (let i = 1; i <= 1000; i++) {
          hookResult.setValue(i);
        }
      });

      expect(hookResult.value).toBe(1000);
      expect(localStorage.getItem(TEST_KEY)).toBe('1000');
    });
  });
});
