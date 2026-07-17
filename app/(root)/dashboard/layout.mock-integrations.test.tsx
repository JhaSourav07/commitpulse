import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DashboardLayout from './layout';
import React from 'react';

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

describe('DashboardLayout - mock integrations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders children asynchronously resolving from a mocked service layer', async () => {
    const MockAsyncChild = () => {
      const [data, setData] = React.useState<string | null>(null);
      React.useEffect(() => {
        setTimeout(() => setData('Async Data Loaded'), 100);
      }, []);
      return <div data-testid="async-child">{data || 'Loading...'}</div>;
    };

    render(
      <DashboardLayout>
        <MockAsyncChild />
      </DashboardLayout>
    );

    expect(screen.getByTestId('async-child')).toHaveTextContent('Loading...');

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('async-child')).toHaveTextContent('Async Data Loaded');
  });

  it('renders correctly with a local cache stub', () => {
    const cachedData = { user: 'Test User', cached: true };
    render(
      <DashboardLayout>
        <div data-testid="cache-child">{cachedData.user}</div>
      </DashboardLayout>
    );
    expect(screen.getByTestId('cache-child')).toHaveTextContent('Test User');
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });
});
