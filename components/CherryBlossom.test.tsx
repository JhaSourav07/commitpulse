import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CherryBlossom from './CherryBlossom';
import type React from 'react';
import '@testing-library/jest-dom';
// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
}));

describe('CherryBlossom', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing after mount', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      expect(container.firstChild).toBeTruthy();
    });
  });

  it('renders the cherry blossom container', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument();
    });
  });

  it('renders 25 falling petals', async () => {
    render(<CherryBlossom />);

    await waitFor(() => {
      const petals = screen.getAllByTestId('motion-div');
      expect(petals).toHaveLength(25);
    });
  });

  it('renders decorative branch SVGs', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      const svgs = container.querySelectorAll('svg');

      // 2 branch SVGs + 25 petal SVGs
      expect(svgs.length).toBeGreaterThanOrEqual(27);
    });
  });

  it('unmounts cleanly without throwing errors', async () => {
    const { unmount } = render(<CherryBlossom />);

    await waitFor(() => {
      expect(screen.getAllByTestId('motion-div')).toHaveLength(25);
    });

    expect(() => unmount()).not.toThrow();
  });
});
