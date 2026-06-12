import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardSkeleton from './DashboardSkeleton';

describe('DashboardSkeleton accessibility', () => {
  it('renders the dashboard skeleton container without crashing', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('uses a responsive grid layout for logical dashboard regions', () => {
    const { container } = render(<DashboardSkeleton />);

    const root = container.firstChild;

    expect(root).toHaveClass('grid');
    expect(root).toHaveClass('grid-cols-1');
    expect(root).toHaveClass('lg:grid-cols-[300px_1fr_320px]');
  });

  it('does not expose decorative loading placeholders as focusable controls', () => {
    render(<DashboardSkeleton />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('does not create incorrect heading hierarchy during loading state', () => {
    render(<DashboardSkeleton />);

    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });

  it('renders shimmer placeholders as non-interactive loading visuals', () => {
    const { container } = render(<DashboardSkeleton />);

    const shimmerElements = container.querySelectorAll('.shimmer');

    expect(shimmerElements.length).toBeGreaterThan(0);

    shimmerElements.forEach((element) => {
      expect(element).not.toHaveAttribute('tabindex');
      expect(element).not.toHaveAttribute('role', 'button');
      expect(element).not.toHaveAttribute('aria-label');
    });
  });
});
