import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DashboardLoading from './loading';

// loading.tsx is intentionally a no-op — it returns null because the
// LoadingScreen overlay is now managed by DashboardPageWrapper (which portals
// it into document.body), so Next.js can no longer abruptly unmount it when
// API data arrives. These tests verify that contract.

describe('DashboardLoading', () => {
  it('renders without crashing', () => {
    const { container } = render(<DashboardLoading />);
    expect(container).toBeTruthy();
  });

  it('renders nothing — returns null so Next.js loading boundary is a no-op', () => {
    const { container } = render(<DashboardLoading />);
    expect(container.firstChild).toBeNull();
  });

  it('renders no DOM nodes at all', () => {
    const { container } = render(<DashboardLoading />);
    expect(container.childElementCount).toBe(0);
  });
});
