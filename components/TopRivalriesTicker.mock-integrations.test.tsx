import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React, { useState, useEffect } from 'react';
import TopRivalriesTicker, { RivalryItem } from './TopRivalriesTicker';
import dbConnect from '@/lib/mongodb';
import '@testing-library/jest-dom';

// Setup router mocks
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock framer-motion so we don't have issues with animations in jsdom
interface MockMotionProps extends React.HTMLAttributes<HTMLDivElement> {
  animate?: unknown;
  transition?: unknown;
}
vi.mock('framer-motion', () => {
  const mockMotionDivInternal = React.forwardRef<HTMLDivElement, MockMotionProps>(
    ({ children, animate: _animate, transition: _transition, ...props }, ref) => {
      void _animate;
      void _transition;
      return (
        <div ref={ref} {...props}>
          {children}
        </div>
      );
    }
  );
  mockMotionDivInternal.displayName = 'MotionDiv';
  return {
    motion: {
      div: mockMotionDivInternal,
    },
  };
});

// Mock database connection import using stubs
vi.mock('@/lib/mongodb', () => {
  return {
    default: vi.fn(),
    dbDisconnect: vi.fn(),
  };
});

// Local cache store stub
const localCache = new Map<string, RivalryItem[]>();

interface TickerContainerProps {
  cacheKey?: string;
  timeoutMs?: number;
  onSuccess?: (data: RivalryItem[]) => void;
}

// Stateful integration wrapper simulating data fetching layer with cache checks, timeouts, and fallbacks
function TopRivalriesTickerAsyncContainer({
  cacheKey = 'rivalries_key',
  timeoutMs = 150,
  onSuccess,
}: TickerContainerProps) {
  const [rivalries, setRivalries] = useState<RivalryItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      // 3. Local cache layer is queried before triggering database retrievals
      if (localCache.has(cacheKey)) {
        if (active) {
          setRivalries(localCache.get(cacheKey) || []);
          setIsLoading(false);
        }
        return;
      }

      try {
        // 1. Mock standard asynchronous database connection
        const db = (await dbConnect()) as unknown as {
          fetchTopRivalries: () => Promise<RivalryItem[]>;
        };

        const queryPromise = db.fetchTopRivalries();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
        );

        // Execute database retrieval with a timeout limit
        const data = (await Promise.race([queryPromise, timeoutPromise])) as RivalryItem[];

        if (active) {
          // 5. Complete cache sync is written on success callbacks
          localCache.set(cacheKey, data);
          if (onSuccess) {
            onSuccess(data);
          }
          setRivalries(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (active) {
          const errorMessage = err instanceof Error ? err.message : 'Error occurred';
          setError(errorMessage);
          setIsLoading(false);
          // 4. Fallback procedures during fake endpoint timeout blocks (fallback to empty array)
          setRivalries([]);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [cacheKey, timeoutMs, onSuccess]);

  return (
    <div data-testid="container-root">
      {/* 2. Pending state overlays render while loading */}
      {isLoading && (
        <div
          data-testid="loading-overlay"
          className="absolute inset-0 bg-black/40 flex items-center justify-center"
        >
          Loading active rivalries...
        </div>
      )}
      {error && <div data-testid="error-message">{error}</div>}
      <TopRivalriesTicker rivalries={rivalries} />
    </div>
  );
}

describe('TopRivalriesTicker — Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  const mockFetchTopRivalries = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localCache.clear();
    mockFetchTopRivalries.mockReset();

    // Default setup for dbConnect returning mock database
    vi.mocked(dbConnect).mockResolvedValue({
      fetchTopRivalries: mockFetchTopRivalries,
    } as unknown as Awaited<ReturnType<typeof dbConnect>>);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. mocks standard database connection and retrieves results successfully', async () => {
    const mockRivalries: RivalryItem[] = [
      {
        u1: 'dev1',
        u2: 'dev2',
        label: 'Rust vs Go',
        icon: () => <span>VS</span>,
        color: 'text-red-500',
      },
    ];
    mockFetchTopRivalries.mockResolvedValue(mockRivalries);

    render(<TopRivalriesTickerAsyncContainer />);

    // Wait until loading overlay is gone and check container loaded the custom data
    await waitFor(() => {
      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    });

    expect(screen.getAllByText('dev1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('dev2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rust vs Go').length).toBeGreaterThan(0);
    expect(mockFetchTopRivalries).toHaveBeenCalledTimes(1);
  });

  it('2. renders pending state overlay while data fetch is active and resolves once database resolves', async () => {
    let resolveFn: (val: RivalryItem[]) => void = () => {};
    const pendingPromise = new Promise<RivalryItem[]>((resolve) => {
      resolveFn = resolve;
    });
    mockFetchTopRivalries.mockReturnValue(pendingPromise);

    render(<TopRivalriesTickerAsyncContainer />);

    // Verify loading overlay renders during pending state
    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
    expect(screen.getByText('Loading active rivalries...')).toBeInTheDocument();

    // Resolve the promise
    const data = [
      {
        u1: 'userA',
        u2: 'userB',
        label: 'A vs B',
        icon: () => <span>VS</span>,
        color: 'text-blue-500',
      },
    ];
    resolveFn(data);

    // Verify loading overlay is removed after resolve
    await waitFor(() => {
      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    });

    expect(screen.getAllByText('userA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('userB').length).toBeGreaterThan(0);
  });

  it('3. asserts local cache layers are queried and avoids triggering database retrievals on cache hit', async () => {
    const cachedRivalries: RivalryItem[] = [
      {
        u1: 'cached1',
        u2: 'cached2',
        label: 'Cache Vs Fresh',
        icon: () => <span>VS</span>,
        color: 'text-green-500',
      },
    ];
    localCache.set('rivalries_key', cachedRivalries);

    render(<TopRivalriesTickerAsyncContainer />);

    // Ticker should load cache content instantly
    await waitFor(() => {
      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    });

    expect(screen.getAllByText('cached1').length).toBeGreaterThan(0);
    // Since cache was hit, dbConnect and fetchTopRivalries shouldn't be called
    expect(dbConnect).not.toHaveBeenCalled();
    expect(mockFetchTopRivalries).not.toHaveBeenCalled();
  });

  it('4. verifies correct fallback procedures during fake database endpoint timeout blocks', async () => {
    vi.useFakeTimers();
    try {
      // Database query promise that hangs indefinitely
      const slowPromise = new Promise<RivalryItem[]>(() => {});
      mockFetchTopRivalries.mockReturnValue(slowPromise);

      render(<TopRivalriesTickerAsyncContainer timeoutMs={20} />);

      // Verify loading overlay renders during pending state
      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();

      // Wait for useEffect's async dbConnect call to resolve and reach the timeoutPromise setup
      await act(async () => {
        await Promise.resolve();
      });

      // Now the timeout timer is registered. Let's advance timers to trigger it
      act(() => {
        vi.advanceTimersByTime(25);
      });

      // Flush microtasks to allow promise rejection handlers to process
      await act(async () => {
        await Promise.resolve();
      });

      // Verify loading overlay is removed after timeout triggers fallback
      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Query timeout');
      // Fallback procedure renders empty rivalries list message
      expect(screen.getByText('No active rivalries')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('5. asserts complete cache sync is written on success callbacks', async () => {
    const successData: RivalryItem[] = [
      {
        u1: 'sync1',
        u2: 'sync2',
        label: 'Sync Success',
        icon: () => <span>VS</span>,
        color: 'text-purple-500',
      },
    ];
    mockFetchTopRivalries.mockResolvedValue(successData);

    const successSpy = vi.fn();

    render(<TopRivalriesTickerAsyncContainer onSuccess={successSpy} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    });

    // Check that success callback triggered
    expect(successSpy).toHaveBeenCalledWith(successData);

    // Verify cache sync was written completely
    expect(localCache.has('rivalries_key')).toBe(true);
    expect(localCache.get('rivalries_key')).toEqual(successData);
  });
});
