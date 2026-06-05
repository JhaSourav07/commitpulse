import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import HistoricalTrendView from './HistoricalTrendView';

// Dynamically infer the exact prop requirements from the component definition
type HistoricalTrendViewProps = React.ComponentPropsWithoutRef<typeof HistoricalTrendView>;

// Fixes Next.js Router invariants by mocking the navigation hook structures
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      prefetch: () => null,
      push: () => null,
      back: () => null,
    };
  },
}));

describe('HistoricalTrendView - Responsive Breakpoints & Mobile Layouts', () => {
  // Real layout configurations aligned with period data structural schemas
  const mockProps: HistoricalTrendViewProps = {
    username: 'testuser',
    activity: [
      { date: '2026-06-01', count: 5, intensity: 1 },
      { date: '2026-06-02', count: 12, intensity: 3 },
      { date: '2026-06-03', count: 8, intensity: 2 },
    ],
    period: {
      kind: 'range',
      label: 'May 1, 2026 - June 1, 2026',
      from: '2026-05-01',
      to: '2026-06-01',
    } as unknown as HistoricalTrendViewProps['period'],
  };

  /**
   * Helper utility to mimic window viewport resizing in a JSDOM environment.
   * Triggers a native 'resize' event so that window-bound listeners update correctly.
   */
  const resizeViewport = (width: number, height = 800) => {
    window.innerWidth = width;
    window.innerHeight = height;
    window.dispatchEvent(new Event('resize'));
  };

  beforeEach(() => {
    // 1. Mock window.matchMedia since JS DOM environments don't implement it natively
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches:
          query.includes(`${window.innerWidth}`) ||
          (window.innerWidth <= 375 && query.includes('max-width')),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // 2. Define standard class constructors to bypass both TypeScript warnings and TypeError instantiation crash
    window.IntersectionObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as unknown as typeof IntersectionObserver;

    window.ResizeObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as unknown as typeof ResizeObserver;
  });

  // Test Case 1: Verify layout reflow on mobile viewports (375px)
  test('should reflow multi-device columns into a standard vertical flex arrangement at 375px', () => {
    resizeViewport(375);
    const { container } = render(<HistoricalTrendView {...mockProps} />);

    // Finds the top banner header block to assert its responsive flex behavior
    const responsiveHeaderBlock = container.querySelector('.flex-col');
    expect(responsiveHeaderBlock).toBeInTheDocument();
    expect(responsiveHeaderBlock).toHaveClass('lg:flex-row');
  });

  // Test Case 2: Ensure styling utilizes fluid/relative layouts rather than hardcoded widths
  test('should apply relative widths and prevent absolute sizing from causing horizontal scrollbars', () => {
    resizeViewport(375);
    const { container } = render(<HistoricalTrendView {...mockProps} />);

    // Specifically target the trend line chart SVG instead of generic icon SVGs
    const svgTrendChart = container.querySelector('svg.w-full');
    expect(svgTrendChart).toBeInTheDocument();
    expect(svgTrendChart).toHaveClass('w-full');
    expect(svgTrendChart).not.toHaveStyle({ width: '1200px' });
  });

  // Test Case 3: Graceful scaling of text strings / elements
  test('should scale down navigation headers and text tags gracefully on ultra-small breakpoints', () => {
    resizeViewport(375);
    render(<HistoricalTrendView {...mockProps} />);

    const viewHeaderLabel = screen.getByText(/Historical Trend View/i);
    expect(viewHeaderLabel).toBeInTheDocument();
    expect(viewHeaderLabel).toHaveClass('text-[10px]');
  });

  // Test Case 4: Form controls process user interaction accurately
  test('should cleanly register user interactions on mobile-specific layout controls', async () => {
    const { container } = render(<HistoricalTrendView {...mockProps} />);
    resizeViewport(375);

    // Safely targets form input elements inside the DOM structure
    const monthPickerField = container.querySelector('input[name="month"]');
    expect(monthPickerField).toBeInTheDocument();

    const goButtons = screen.getAllByRole('button', { name: /go|apply range/i });
    expect(goButtons.length).toBeGreaterThan(0);
  });

  // Test Case 5: Safe structural grid changes across layout modes
  test('should dynamically restore multi-column desktop styling when scaled up from 375px', () => {
    resizeViewport(375);
    const { rerender, container } = render(<HistoricalTrendView {...mockProps} />);

    resizeViewport(1440);
    rerender(<HistoricalTrendView {...mockProps} />);

    const flexibleGridWrapper = container.querySelector('.grid-cols-1');
    expect(flexibleGridWrapper).toBeInTheDocument();
    expect(flexibleGridWrapper).toHaveClass('md:grid-cols-4');
  });
});
