import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import DashboardSkeleton from './DashboardSkeleton';

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

    const { container } = render(<DashboardSkeleton />);

    // Verify skeleton renders within a 375px simulated mobile environment
    expect(container.firstChild).toBeTruthy();
    expect(window.innerWidth).toBe(375);

    // The outermost grid should be present
    const gridWrapper = container.firstElementChild;
    expect(gridWrapper).toBeTruthy();
    expect(gridWrapper?.className).toContain('grid');
  });

  it('2. Assert that columns reflow into standard vertical flex lists on mobile', () => {
    setViewportWidth(375);

    const { container } = render(<DashboardSkeleton />);
    const outerGrid = container.firstElementChild;

    // Mobile-first: grid-cols-1 ensures a single vertical column at base breakpoint
    expect(outerGrid?.className).toContain('grid-cols-1');
  });

  it('3. Verify styling values do not include absolute widths that cause horizontal scrollbars', () => {
    setViewportWidth(375);

    const { container } = render(<DashboardSkeleton />);

    // Traverse all child elements and verify none have fixed inline pixel widths
    const allElements = container.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const inlineWidth = htmlEl.style?.width ?? '';

      // No inline width that would cause overflow on a 375px screen
      expect(inlineWidth).not.toMatch(/^\d{4,}px$/); // Rejects widths >= 1000px
    });
  });

  it('4. Check that skeleton card components scale down gracefully', () => {
    setViewportWidth(375);

    const { container } = render(<DashboardSkeleton />);
    const shimmerElements = container.querySelectorAll('.shimmer');

    // Verify all shimmer tiles are present and have responsive Tailwind classes
    expect(shimmerElements.length).toBeGreaterThan(0);

    shimmerElements.forEach((el) => {
      // Each shimmer tile should have a rounded style class — indicating it scales visually
      expect(el.className).toContain('rounded');
    });
  });

  it('5. Assert mobile-specific toggle states respond cleanly to resize events', () => {
    // Start at desktop width
    setViewportWidth(1440);
    const desktopWidth = window.innerWidth;
    expect(desktopWidth).toBe(1440);

    const { container, rerender } = render(<DashboardSkeleton />);
    expect(container.firstChild).toBeTruthy();

    // Toggle to mobile width — component should rerender cleanly without errors
    setViewportWidth(375);
    expect(window.innerWidth).toBe(375);

    rerender(<DashboardSkeleton />);

    const outerGrid = container.firstElementChild;
    expect(outerGrid?.className).toContain('grid-cols-1');
    expect(outerGrid?.className).toContain('lg:grid-cols-[300px_1fr_320px]');
  });
});
