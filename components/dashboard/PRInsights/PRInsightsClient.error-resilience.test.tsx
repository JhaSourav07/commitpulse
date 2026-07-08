import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PRInsightsClient from './PRInsightsClient';
import { logger } from '@/lib/logger';
import React from 'react';

// Mutable flag so a mocked child can throw on demand and recover after reset.
let shouldThrow = false;

// Mock child components to isolate PRInsightsClient. TopMetricsRow is able to
// throw a runtime exception on demand via the `shouldThrow` flag above.
vi.mock('./TopMetricsRow', () => ({
  default: () => {
    if (shouldThrow) {
      throw new Error('TopMetricsRow render failure');
    }
    return <div data-testid="top-metrics">Top Metrics</div>;
  },
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

// Reuse the repository's existing logger utility as a spy target instead of
// introducing a new logging mechanism.
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockData = {
  totalPRs: 5,
  mergedPRs: 3,
  openPRs: 1,
  closedPRs: 1,
  highlights: [],
};

describe('PRInsightsClient - Error Resilience', () => {
  let originalFetch: typeof global.fetch;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalFetch = global.fetch;
    localStorage.clear();
    shouldThrow = false;
    vi.clearAllMocks();
    // React logs caught render errors to console.error even when a boundary
    // catches them; silence that expected noise so it doesn't pollute output.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('1. catches a nested child component runtime exception without crashing the tree', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
    shouldThrow = true;

    expect(() => render(<PRInsightsClient username="testuser" />)).not.toThrow();

    await waitFor(() => {
      expect(screen.queryByTestId('top-metrics')).toBeNull();
    });
  });

  it('2. handles a thrown service/database exception from the fetch layer without crashing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    expect(() => render(<PRInsightsClient username="testuser" />)).not.toThrow();

    await waitFor(() => {
      expect(screen.getByText('Error loading insights: Failed to fetch')).toBeDefined();
    });
  });

  it('3. renders a clean recovery UI instead of a crashed screen when a child throws', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
    shouldThrow = true;

    render(<PRInsightsClient username="testuser" />);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong while loading insights.')).toBeDefined();
    });
    expect(screen.getByRole('button', { name: /try again/i })).toBeDefined();
    expect(screen.queryByTestId('trend-chart')).toBeNull();
  });

  it('4. logs the caught render exception through lib/logger', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
    shouldThrow = true;

    render(<PRInsightsClient username="testuser" />);

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith(
        'PRInsightsClient render exception',
        expect.objectContaining({ message: 'TopMetricsRow render failure' })
      );
    });
  });

  it('5. recovers via the reset/retry path once the underlying error is resolved', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
    shouldThrow = true;

    render(<PRInsightsClient username="testuser" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeDefined();
    });

    // Simulate the underlying issue being resolved before the user retries.
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByTestId('top-metrics')).toBeDefined();
    });
    expect(screen.queryByText('Something went wrong while loading insights.')).toBeNull();
  });
});
