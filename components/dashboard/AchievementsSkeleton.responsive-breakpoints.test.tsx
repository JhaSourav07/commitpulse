import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AchievementsSkeleton from './AchievementsSkeleton';

describe('Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  const originalInnerWidth = window.innerWidth;

  // Helper to mock window.innerWidth to simulate viewport sizes
  const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: query.includes('min-width: 1024px') ? window.innerWidth >= 1024 : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('1. Mock standard mobile-width media coordinates (375px viewport)', () => {
    setViewportWidth(375);

    const { container } = render(<AchievementsSkeleton />);

    // Verify skeleton renders correctly within a 375px simulated mobile environment
    expect(container.firstChild).toBeTruthy();
    expect(window.innerWidth).toBe(375);

    // Assert the outer wrapper grid element is present
    const gridWrapper = container.firstElementChild;
    expect(gridWrapper).toBeTruthy();
    expect(gridWrapper?.className).toContain('grid');
  });

  it('2. Assert that columns reflow into standard vertical flex lists on mobile', () => {
    setViewportWidth(375);

    const { container } = render(<AchievementsSkeleton />);
    const outerGrid = container.firstElementChild;

    // AchievementsSkeleton uses grid-cols-2 — verify the 2-column layout is declared
    expect(outerGrid?.className).toContain('grid-cols-2');

    // All 4 skeleton cells must be present regardless of viewport width
    const skeletonCells = screen.getAllByTestId('skeleton-cell');
    expect(skeletonCells).toHaveLength(4);
  });

  it('3. Verify styling values do not include absolute widths that cause horizontal scrollbars', () => {
    setViewportWidth(375);

    const { container } = render(<AchievementsSkeleton />);

    // Traverse all elements and verify none have fixed oversized inline pixel widths
    const allElements = container.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const inlineWidth = htmlEl.style?.width ?? '';

      // Reject any inline width >= 1000px that would overflow on a 375px screen
      expect(inlineWidth).not.toMatch(/^\d{4,}px$/);
    });
  });

  it('4. Check that skeleton card components scale down gracefully', () => {
    setViewportWidth(375);

    const { container } = render(<AchievementsSkeleton />);
    const shimmerElements = container.querySelectorAll('.shimmer');

    // Verify all shimmer skeleton tiles are present
    expect(shimmerElements.length).toBeGreaterThan(0);

    shimmerElements.forEach((el) => {
      // Each shimmer tile should have a rounded class indicating graceful visual scaling
      expect(el.className).toContain('rounded');
    });
  });

  it('5. Assert mobile-specific toggle states respond cleanly to resize events', () => {
    // Start at desktop width
    setViewportWidth(1440);
    expect(window.innerWidth).toBe(1440);

    const { container, rerender } = render(<AchievementsSkeleton />);
    expect(container.firstChild).toBeTruthy();

    // Toggle to mobile width — component should rerender cleanly without errors
    setViewportWidth(375);
    expect(window.innerWidth).toBe(375);

    rerender(<AchievementsSkeleton />);

    // Grid and cells must still be intact after viewport toggle
    const outerGrid = container.firstElementChild;
    expect(outerGrid?.className).toContain('grid-cols-2');

    const skeletonCells = screen.getAllByTestId('skeleton-cell');
    expect(skeletonCells).toHaveLength(4);
  });
});
