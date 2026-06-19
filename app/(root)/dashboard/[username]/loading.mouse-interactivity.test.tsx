import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import DashboardUserLoading from './loading';

vi.mock('@/components/dashboard/DashboardSkeleton', () => ({
  default: () => <div data-testid="dashboard-skeleton">Dashboard Skeleton</div>,
}));

describe('DashboardUserLoading', () => {
  it('renders the dashboard skeleton component', () => {
    const { getByTestId } = render(<DashboardUserLoading />);

    expect(getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('renders a single dashboard skeleton instance', () => {
    const { getAllByTestId } = render(<DashboardUserLoading />);

    expect(getAllByTestId('dashboard-skeleton')).toHaveLength(1);
  });

  it('applies the loading page background and text color classes', () => {
    const { container } = render(<DashboardUserLoading />);

    const wrapper = container.firstElementChild;

    expect(wrapper?.className).toContain('bg-black');
    expect(wrapper?.className).toContain('text-white');
  });

  it('applies responsive spacing and screen height classes', () => {
    const { container } = render(<DashboardUserLoading />);

    const wrapper = container.firstElementChild;

    expect(wrapper?.className).toContain('min-h-screen');
    expect(wrapper?.className).toContain('p-4');
    expect(wrapper?.className).toContain('md:p-6');
    expect(wrapper?.className).toContain('lg:p-8');
  });

  it('renders consistently across repeated mounts', () => {
    const { unmount } = render(<DashboardUserLoading />);

    unmount();

    const secondRender = render(<DashboardUserLoading />);

    expect(secondRender.container.querySelector('[data-testid="dashboard-skeleton"]')).toBeTruthy();
  });
});
