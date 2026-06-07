import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import DashboardSkeleton from './DashboardSkeleton';

describe('DashboardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.firstChild).not.toBeNull();
  });

  it('contains shimmer placeholder elements', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThan(0);
  });

  it('renders the 3-column grid layout', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.querySelector('.lg\\:grid-cols-\\[300px_1fr_320px\\]')).toBeTruthy();
  });
});
