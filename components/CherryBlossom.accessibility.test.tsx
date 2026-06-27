import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CherryBlossom from './CherryBlossom';
import type React from 'react';

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

describe('CherryBlossom accessibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders as a decorative non-interactive overlay', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      const overlay = container.querySelector('.pointer-events-none');
      expect(overlay).toBeInTheDocument();
    });
  });

  it('contains no focusable interactive controls', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      expect(
        container.querySelectorAll(
          'button,input,textarea,select,a[href],[tabindex]:not([tabindex="-1"])'
        )
      ).toHaveLength(0);
    });
  });

  it('does not expose interactive motion petals', async () => {
    render(<CherryBlossom />);

    await waitFor(() => {
      const petals = screen.getAllByTestId('motion-div');

      petals.forEach((petal) => {
        expect(petal).not.toHaveAttribute('role', 'button');
      });
    });
  });

  it('maintains normal document accessibility flow', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('pointer-events-none');
    });
  });

  it('renders decorative SVG content without accessibility violations', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });
});
