import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CherryBlossom from './CherryBlossom';
import type React from 'react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      ...props
    }: React.PropsWithChildren<
      {
        initial?: unknown;
        animate?: unknown;
      } & React.HTMLAttributes<HTMLDivElement>
    >) => (
      <div
        data-testid="motion-div"
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        {...props}
      >
        {children}
      </div>
    ),
  },
}));

describe('CherryBlossom Timezone Boundaries', () => {
  const originalDateNow = Date.now;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  it('renders correctly at a UTC midnight boundary', async () => {
    Date.now = vi.fn(() => new Date('2024-01-01T00:00:00Z').getTime());

    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument();
      expect(screen.getAllByTestId('motion-div')).toHaveLength(25);
    });
  });

  it('preserves petal rendering near EST calendar boundaries', async () => {
    Date.now = vi.fn(() => new Date('2024-01-01T04:59:59Z').getTime());

    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      expect(container.querySelector('.pointer-events-none')).toBeInTheDocument();
      expect(screen.getAllByTestId('motion-div')).toHaveLength(25);
    });
  });

  it('maintains viewport based animation coordinates across timezone boundaries', async () => {
    Date.now = vi.fn(() => new Date('2024-06-01T00:00:00Z').getTime());

    render(<CherryBlossom />);

    await waitFor(() => {
      const petals = screen.getAllByTestId('motion-div');

      expect(petals.length).toBe(25);

      const firstPetal = petals[0];

      const initial = JSON.parse(firstPetal.getAttribute('data-initial') || '{}');
      const animate = JSON.parse(firstPetal.getAttribute('data-animate') || '{}');

      expect(initial.x).toMatch(/vw$/);
      expect(initial.y).toMatch(/vh$/);

      expect(Array.isArray(animate.x)).toBe(true);
      expect(Array.isArray(animate.y)).toBe(true);
    });
  });

  it('renders consistently on leap year boundary dates', async () => {
    Date.now = vi.fn(() => new Date('2024-02-29T23:59:59Z').getTime());

    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      expect(screen.getAllByTestId('motion-div')).toHaveLength(25);

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(27);
    });
  });

  it('remains stable during daylight saving transition timestamps', async () => {
    Date.now = vi.fn(() => new Date('2024-03-10T07:00:00Z').getTime());

    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      expect(screen.getAllByTestId('motion-div')).toHaveLength(25);

      expect(container.querySelector('.absolute.-top-10.-right-10')).toBeInTheDocument();

      expect(container.querySelector('.absolute.-top-20.-left-20')).toBeInTheDocument();
    });
  });
});
