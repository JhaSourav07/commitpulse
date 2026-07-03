import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PRInsightsClient from './PRInsightsClient';
import React from 'react';

// Mock child components to isolate PRInsightsClient
vi.mock('./TopMetricsRow', () => ({
  default: () => <div data-testid="top-metrics">Top Metrics</div>,
}));
vi.mock('./PRTrendChart', () => ({
  default: () => <div data-testid="trend-chart">Trend Chart</div>,
}));
vi.mock('./PRStatusDistribution', () => ({
  default: () => <div data-testid="status-dist">Status Dist</div>,
}));
vi.mock('./ReviewAnalytics', () => ({
  default: () => <div data-testid="review-analytics">Review Analytics</div>,
}));
vi.mock('./RepoPerformanceTable', () => ({
  default: () => <div data-testid="repo-perf">Repo Perf</div>,
}));
vi.mock('./Highlights', () => ({ default: () => <div data-testid="highlights">Highlights</div> }));

const mockData = {
  totalPRs: 5,
  mergedPRs: 3,
  openPRs: 1,
  closedPRs: 1,
  highlights: [],
};

describe('PRInsightsClient - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('1. mocks standard asynchronous imports and databases using stubs', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    render(<PRInsightsClient username="testuser" />);

    await waitFor(() => {
      expect(screen.getByTestId('top-metrics')).toBeDefined();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pr-insights?username=testuser',
      expect.any(Object)
    );
  });

  it('2. tests service loading paths to ensure pending state overlays render', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {})); // Never resolves

    render(<PRInsightsClient username="testuser" />);

    expect(screen.getByText('Crunching your pull requests...')).toBeDefined();
  });

  it('3. asserts local cache layers are queried before triggering database retrievals', async () => {
    // Populate cache
    localStorage.setItem('pr-insights-testuser', JSON.stringify(mockData));
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    render(<PRInsightsClient username="testuser" />);

    // Should load from cache directly and render child component
    await waitFor(() => {
      expect(screen.getByTestId('top-metrics')).toBeDefined();
    });

    // Fetch should NOT be called because it was fulfilled from cache
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('4. verifies correct fallback procedures during fake endpoint timeout blocks', async () => {
    vi.useFakeTimers();
    // Simulate a delayed fetch that takes longer than the timeout (5000ms)
    global.fetch = vi.fn().mockImplementation((url, options) => {
      return new Promise((resolve, reject) => {
        const signal = options?.signal;
        if (signal) {
          signal.addEventListener('abort', () => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }
      });
    });

    render(<PRInsightsClient username="testuser" />);

    // Fast-forward past the 5000ms timeout
    vi.advanceTimersByTime(5100);
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('Error loading insights: Request timed out')).toBeDefined();
    });
  });

  it('5. asserts complete cache sync is written on success callbacks', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    render(<PRInsightsClient username="testuser" />);

    await waitFor(() => {
      expect(screen.getByTestId('top-metrics')).toBeDefined();
    });

    // Assert cache was written
    const cachedData = localStorage.getItem('pr-insights-testuser');
    expect(cachedData).toBeDefined();
    expect(JSON.parse(cachedData!)).toEqual(mockData);
  });
});
