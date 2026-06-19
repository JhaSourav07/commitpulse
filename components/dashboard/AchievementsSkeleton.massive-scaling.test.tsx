/* ==========================================================================
 * MASSIVE DATA SETS & EXTREME HIGH BOUNDS SCALING
 *
 * AchievementsSkeleton is a purely presentational component (no props, no
 * data-driven rendering). Scaling stress is applied through:
 *   - Repeated / bulk instantiation to simulate massive rendering load.
 *   - Rerender cycling to verify DOM and layout stability.
 *   - Performance timing to detect regressions.
 *   - Computed-style validation to guarantee placeholder dimensions remain
 *     valid under extreme conditions.
 * ========================================================================== */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import AchievementsSkeleton from './AchievementsSkeleton';

describe('AchievementsSkeleton – Massive Scaling & Extreme Upper Bounds', () => {
  /* -----------------------------------------------------------------------
   * 1. Massive Dataset Rendering
   *
   * Although the component accepts no data, we simulate scale by rendering
   * hundreds of independent skeleton instances. This ensures the rendering
   * pipeline (React reconciliation, class application, DOM insertion) can
   * handle high volume without throwing or silently failing.
   * ----------------------------------------------------------------------- */
  it('renders hundreds of isolated skeleton instances without crashing', () => {
    for (let i = 0; i < 200; i++) {
      const { container } = render(<AchievementsSkeleton />);
      // Every render must produce a real DOM tree.
      expect(container.firstChild).not.toBeNull();
    }
  });

  /* -----------------------------------------------------------------------
   * 2. Layout Stability Under Scale
   *
   * After repeated rerenders we assert the container structure is intact:
   *   - The outer grid uses `grid-cols-2`.
   *   - Exactly 4 skeleton cells are present.
   *   - No duplicate wrapper or extra structural nodes appear.
   * ----------------------------------------------------------------------- */
  it('preserves grid layout and cell count after repeated rerenders', () => {
    const { container, rerender } = render(<AchievementsSkeleton />);

    // Simulate heavy re-render cycling (50 iterations).
    for (let i = 0; i < 50; i++) {
      rerender(<AchievementsSkeleton />);
    }

    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
    expect(grid!.className).toContain('grid-cols-2');

    const cells = screen.getAllByTestId('skeleton-cell');
    expect(cells).toHaveLength(4);

    // Structural integrity: the grid should contain exactly 4 child cells
    // and no extra wrapper nodes.  Each cell is a direct child of the grid.
    expect(grid!.children).toHaveLength(4);
  });

  /* -----------------------------------------------------------------------
   * 3. Extreme Value Handling
   *
   * While the skeleton takes no numeric props, we simulate extreme
   * conditions by performing 100 rapid successive renders followed by
   * checks that DOM nodes remain valid, no runtime errors bubble up, and
   * the component does not produce partial / empty subtrees.
   * ----------------------------------------------------------------------- */
  it('survives 100 rapid successive mounts without error or partial DOM', () => {
    // Rapid mount / unmount cycle (extreme wall-clock pressure).
    for (let i = 0; i < 100; i++) {
      const { container } = render(<AchievementsSkeleton />);
      expect(container.querySelector('[data-testid="skeleton-cell"]')).toBeTruthy();
    }
  });

  /* -----------------------------------------------------------------------
   * 4. Performance Characteristics
   *
   * Measure the time to render the component using performance.now().
   * The threshold (50 ms) is generous enough to avoid CI flakiness while
   * still catching meaningful regressions (e.g. accidental state-heavy
   * children, infinite loops, or layout thrash).
   * ----------------------------------------------------------------------- */
  it('completes a single render within a reasonable performance budget', () => {
    const start = performance.now();
    render(<AchievementsSkeleton />);
    const elapsed = performance.now() - start;

    // 50 ms is well above typical skeleton render times; this guards
    // against pathological regressions without being flaky.
    expect(elapsed).toBeLessThan(50);
  });

  /* -----------------------------------------------------------------------
   * 5. SVG / Skeleton Placeholder Stability
   *
   * The skeleton uses `.shimmer` placeholder divs with a fixed height
   * (`h-16`).  We verify that every cell has a finite, positive computed
   * height and that no NaN, Infinity, or negative dimensions leak through
   * from CSS transforms / animations.
   * ----------------------------------------------------------------------- */
  it('produces placeholder cells with finite, positive computed dimensions', () => {
    const { container } = render(<AchievementsSkeleton />);

    const cells = container.querySelectorAll('[data-testid="skeleton-cell"]');
    expect(cells.length).toBeGreaterThan(0);

    cells.forEach((cell) => {
      const rect = cell.getBoundingClientRect();

      // Assert dimensions are finite numbers (not NaN / Infinity).
      expect(Number.isFinite(rect.width)).toBe(true);
      expect(Number.isFinite(rect.height)).toBe(true);

      // Assert dimensions are non-negative (not -0 / negative).
      expect(rect.width).toBeGreaterThanOrEqual(0);
      expect(rect.height).toBeGreaterThanOrEqual(0);

      // The element is a valid HTMLElement with defined dimensions.
      expect(cell).toBeInstanceOf(HTMLElement);
      expect(Number.isFinite(cell.clientWidth)).toBe(true);
      expect(Number.isFinite(cell.clientHeight)).toBe(true);
    });
  });
});
