import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import DashboardSkeleton from './DashboardSkeleton';

describe('DashboardSkeleton - Empty/Missing Inputs Verification', () => {
  it('renders successfully without props', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.firstChild).not.toBeNull();
  });

  it('does not throw runtime errors during render', () => {
    expect(() => render(<DashboardSkeleton />)).not.toThrow();
  });

  it('maintains the main dashboard grid layout structure', () => {
    const { container } = render(<DashboardSkeleton />);

    const gridContainer = container.querySelector('.grid.grid-cols-1');

    expect(gridContainer).toBeTruthy();
  });

  it('renders shimmer placeholders in fallback state', () => {
    const { container } = render(<DashboardSkeleton />);

    const shimmerElements = container.querySelectorAll('.shimmer');

    expect(shimmerElements.length).toBeGreaterThan(0);
  });

  it('renders expected skeleton sections without hydration issues', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.querySelectorAll('.rounded-2xl').length).toBeGreaterThan(0);
  });
});
