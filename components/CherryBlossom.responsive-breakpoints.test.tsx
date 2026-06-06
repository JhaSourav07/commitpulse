import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CherryBlossom from './CherryBlossom';
import type React from 'react';
import '@testing-library/jest-dom';

// Mock framer-motion to inspect the props passed to the animated elements
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      transition,
      ...props
    }: React.PropsWithChildren<
      {
        initial?: unknown;
        animate?: unknown;
        transition?: unknown;
      } & React.HTMLAttributes<HTMLDivElement>
    >) => (
      <div
        data-testid="motion-div"
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
        {...props}
      >
        {children}
      </div>
    ),
  },
}));

describe('CherryBlossom - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Reset standard window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  it('verifies overlay viewport coverage and non-blocking layout across screen sizes', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('fixed', 'inset-0');
      // Ensure z-index is configured to place backdrop behind but layout is non-blocking
      expect(overlay).toHaveClass('pointer-events-none', 'z-10');
    });
  });

  it('verifies overflow prevention is active to prevent scrollbars on mobile viewports', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('overflow-hidden');
    });
  });

  it('asserts background branches are absolutely positioned to anchor at viewport corners', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      // Find branch wrapper divs using the expected styling classes
      const topRightBranch = container.querySelector('.absolute.-top-10.-right-10');
      const topLeftBranch = container.querySelector('.absolute.-top-20.-left-20');

      expect(topRightBranch).toBeInTheDocument();
      expect(topLeftBranch).toBeInTheDocument();

      expect(topRightBranch).toHaveClass(
        'absolute',
        '-top-10',
        '-right-10',
        'w-[400px]',
        'h-[300px]'
      );
      expect(topLeftBranch).toHaveClass(
        'absolute',
        '-top-20',
        '-left-20',
        'w-[500px]',
        'h-[400px]'
      );
    });
  });

  it('verifies fluid responsive units (vw/vh) are used for petal coordinates and motion paths', async () => {
    render(<CherryBlossom />);

    await waitFor(() => {
      const petals = screen.getAllByTestId('motion-div');
      expect(petals.length).toBeGreaterThan(0);

      petals.forEach((petal) => {
        const initialAttr = petal.getAttribute('data-initial');
        const animateAttr = petal.getAttribute('data-animate');

        expect(initialAttr).toBeTruthy();
        expect(animateAttr).toBeTruthy();

        const initial = JSON.parse(initialAttr!);
        const animate = JSON.parse(animateAttr!);

        // Verify initial positioning uses viewport units (vw for horizontal, vh for vertical)
        expect(initial.x).toMatch(/vw$/);
        expect(initial.y).toMatch(/vh$/);

        // Verify animation path uses fluid viewport units
        expect(Array.isArray(animate.x)).toBe(true);
        animate.x.forEach((xVal: string) => {
          expect(xVal).toMatch(/vw$/);
        });

        expect(Array.isArray(animate.y)).toBe(true);
        animate.y.forEach((yVal: string) => {
          expect(yVal).toMatch(/vh$/);
        });
      });
    });
  });

  it('verifies render count stability of petals under simulated mobile, tablet, and desktop viewports', async () => {
    const viewports = [
      { width: 375, height: 667 }, // Mobile (iPhone SE)
      { width: 768, height: 1024 }, // Tablet (iPad)
      { width: 1440, height: 900 }, // Desktop
    ];

    for (const vp of viewports) {
      // Clean up previous renders
      const { unmount } = render(<CherryBlossom />);

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: vp.width,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: vp.height,
      });

      await waitFor(() => {
        const petals = screen.getAllByTestId('motion-div');
        expect(petals).toHaveLength(25);
      });

      unmount();
    }
  });
});
