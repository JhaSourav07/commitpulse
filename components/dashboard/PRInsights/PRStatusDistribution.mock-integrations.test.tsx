/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import PRStatusDistribution from './PRStatusDistribution';
import prService from '@/services/github/pr-service';
import '@testing-library/jest-dom';

// 1. Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// 2. Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="recharts-responsive-container">{children}</div>
  ),
  PieChart: ({ children }: any) => <div data-testid="recharts-pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="recharts-pie">{children}</div>,
  Cell: ({ ...props }: any) => <div data-testid="recharts-cell" {...props} />,
  Tooltip: () => <div data-testid="recharts-tooltip" />,
}));

// 3. Mock Lucide Icons for clean assertions
vi.mock('lucide-react', () => ({
  ExternalLink: () => <div data-testid="icon-external-link" />,
  Loader2: () => <div data-testid="icon-loader" className="animate-spin" />,
  AlertCircle: () => <div data-testid="icon-alert-circle" />,
  RefreshCw: () => <div data-testid="icon-refresh" />,
}));

// 4. Mock TranslationContext
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'dashboard.prInsights.status_title': 'PR Status Distribution',
        'dashboard.prInsights.total': 'Total',
        'dashboard.prInsights.merged': 'Merged',
        'dashboard.prInsights.open': 'Open',
        'dashboard.prInsights.closed': 'Closed',
      };
      return map[key] || key;
    },
  }),
}));

// 5. Mock the PRService module
vi.mock('@/services/github/pr-service', () => {
  return {
    default: {
      fetchPRStatusDistribution: vi.fn(),
      getCachedData: vi.fn(),
      setCachedData: vi.fn(),
      clearCache: vi.fn(),
    },
  };
});

describe('PRStatusDistribution Mock Integrations (Variation 9)', () => {
  const mockData = {
    open: 5,
    closed: 3,
    merged: 12,
  };

  let mockCache: Map<string, any>;

  beforeEach(() => {
    vi.resetAllMocks();
    mockCache = new Map<string, any>();

    // Provide default mock implementations
    vi.mocked(prService.getCachedData).mockImplementation((username: string) =>
      mockCache.get(username.trim().toLowerCase())
    );
    vi.mocked(prService.setCachedData).mockImplementation((username: string, data: any) => {
      mockCache.set(username.trim().toLowerCase(), data);
      return undefined;
    });
    vi.mocked(prService.clearCache).mockImplementation(() => {
      mockCache.clear();
    });

    prService.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1: should mock standard asynchronous service-layer imports and database/fetch retrieval successfully', async () => {
    vi.mocked(prService.fetchPRStatusDistribution).mockResolvedValue(mockData);

    await act(async () => {
      render(<PRStatusDistribution username="octocat" />);
    });

    // Wait for data resolution and check rendering
    await waitFor(() => {
      expect(screen.queryByTestId('pending-overlay')).not.toBeInTheDocument();
    });

    expect(screen.getByText('PR Status Distribution')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText(/Merged/)).toBeInTheDocument();
    expect(screen.getByText(/Open/)).toBeInTheDocument();
    expect(screen.getByText(/Closed/)).toBeInTheDocument();

    expect(prService.fetchPRStatusDistribution).toHaveBeenCalledWith('octocat');
  });

  it('Test 2: should test service loading paths to ensure pending state overlays render', async () => {
    // Mock the fetch to delay resolution indefinitely
    let resolvePromise: any;
    const fetchPromise = new Promise<any>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(prService.fetchPRStatusDistribution).mockReturnValue(fetchPromise);

    render(<PRStatusDistribution username="slow-user" />);

    // Assert that loading/pending overlay is immediately visible
    expect(screen.getByTestId('pending-overlay')).toBeInTheDocument();
    expect(screen.getByText('Loading PR distribution...')).toBeInTheDocument();
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();

    // Clean up outstanding promise to avoid leak
    await act(async () => {
      resolvePromise(mockData);
    });
  });

  it('Test 3: should assert local cache layers are queried before triggering database retrievals', async () => {
    // Seed the cache stub directly
    const cachedData = { open: 1, closed: 1, merged: 8 };
    mockCache.set('cached-user', cachedData);

    await act(async () => {
      render(<PRStatusDistribution username="cached-user" />);
    });

    // Verify it renders immediately from cache without pending-overlay
    expect(screen.queryByTestId('pending-overlay')).not.toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    // Verify that remote service fetch was bypassed
    expect(prService.getCachedData).toHaveBeenCalledWith('cached-user');
    expect(prService.fetchPRStatusDistribution).not.toHaveBeenCalled();
  });

  it('Test 4: should verify correct fallback procedures during fake endpoint timeout blocks', async () => {
    // Mock fetch to delay longer than the component timeout
    vi.mocked(prService.fetchPRStatusDistribution).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockData), 200);
        })
    );

    render(<PRStatusDistribution username="timeout-user" timeoutMs={30} />);

    // Initially loading state
    expect(screen.getByTestId('pending-overlay')).toBeInTheDocument();

    // Fallback UI replaces loading overlay due to timeout
    await waitFor(
      () => {
        expect(screen.queryByTestId('pending-overlay')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    expect(screen.getByTestId('fallback-error')).toBeInTheDocument();
    expect(screen.getByText('Request timed out')).toBeInTheDocument();
  });

  it('Test 5: should assert complete cache sync is written on success callbacks', async () => {
    vi.mocked(prService.fetchPRStatusDistribution).mockResolvedValue(mockData);

    await act(async () => {
      render(<PRStatusDistribution username="sync-user" />);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('pending-overlay')).not.toBeInTheDocument();
    });

    // Ensure the cache sync occurred on successful fetch
    expect(prService.setCachedData).toHaveBeenCalledWith('sync-user', mockData);
  });
});
