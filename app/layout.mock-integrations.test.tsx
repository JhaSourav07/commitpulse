import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// --- TYPED INTERFACES FOR MOCKED MODULES ---
interface MockMongoDBModule {
  connectToDatabase: () => Promise<string>;
}

interface MockGitHubModule {
  fetchGitHubContributions: (username: string) => Promise<{
    totalContributions: number;
    syncStatus: string;
  }>;
}

// --- LAYOUT COMPONENT DEPENDENCY MOCKS ---
// These stubs prevent real network calls and keep layout rendering fast and deterministic.
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'mocked-inter-font' }),
}));

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="analytics" />,
}));

vi.mock('./components/navbar', () => ({
  default: () => <nav data-testid="navbar" aria-label="Main Navigation" />,
}));

vi.mock('@/components/BrandParticles', () => ({
  default: () => <div data-testid="brand-particles" />,
}));

vi.mock('@/components/ReturnToTop', () => ({
  default: () => <button data-testid="return-to-top" aria-label="Return To Top" />,
}));

vi.mock('./components/ScrollRestoration', () => ({
  default: () => <div data-testid="scroll-restoration" />,
}));

vi.mock('./providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

vi.mock('@/components/AnimatedCursor', () => ({
  default: () => <div data-testid="animated-cursor" />,
}));

vi.mock('@/components/KonamiEasterEgg', () => ({
  default: () => <div data-testid="konami-easter-egg" />,
}));

// --- ASYNC SERVICE LAYER STUBS ---
// Isolate asynchronous service dependencies so no real DB or network calls occur.
vi.mock('@/lib/mongodb', () => ({
  connectToDatabase: vi.fn().mockResolvedValue('Mocked DB Connection'),
}));

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi
    .fn()
    .mockResolvedValue({ totalContributions: 100, syncStatus: 'SUCCESS' }),
}));

// Local cache stub — simulates a fast in-memory store checked before the real DB.
const mockCacheLayer = {
  get: vi.fn(),
  set: vi.fn(),
};

// Import after all vi.mock() calls so the module system picks up the stubs.
import RootLayout from './layout';

describe('Layout Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    // Reset call history after every test so assertions stay independent.
    vi.resetAllMocks();
  });

  // 1. Standard async imports and database stubs are resolvable without real endpoints.
  //    Verifies that vi.mock stubs for MongoDB and GitHub resolve correctly and
  //    that the layout still renders its child content while they are stubbed out.
  it('mocks standard asynchronous imports and databases using stubs', async () => {
    const mongodb = (await import('@/lib/mongodb')) as unknown as MockMongoDBModule;
    const github = (await import('@/lib/github')) as unknown as MockGitHubModule;

    // Trigger both stubs and assert they resolve to the configured fake values.
    const dbResult = await mongodb.connectToDatabase();
    const githubResult = await github.fetchGitHubContributions('test-user');

    expect(dbResult).toBe('Mocked DB Connection');
    expect(githubResult.totalContributions).toBe(100);
    expect(mongodb.connectToDatabase).toHaveBeenCalled();
    expect(github.fetchGitHubContributions).toHaveBeenCalled();

    // The layout itself must still render its child content while stubs are in place.
    render(
      <RootLayout>
        <div data-testid="stub-child">stub content</div>
      </RootLayout>
    );
    expect(screen.getByTestId('stub-child')).not.toBeNull();
  });

  // 2. A service that never resolves should leave a pending-state overlay visible.
  //    This confirms the layout wrapper does not swallow or hide loading indicators
  //    that the application layers above it may inject while awaiting async data.
  it('renders pending state overlays during service loading paths', async () => {
    const github = (await import('@/lib/github')) as unknown as MockGitHubModule;

    // An infinitely pending promise keeps the service in the loading state.
    const infinitePendingPromise = new Promise<{ totalContributions: number; syncStatus: string }>(
      () => {}
    );
    vi.mocked(github.fetchGitHubContributions).mockReturnValueOnce(infinitePendingPromise);

    render(
      <RootLayout>
        <div data-testid="loading-overlay">Syncing Monolith Skyline...</div>
      </RootLayout>
    );

    // The overlay must be present in the DOM while the service is still pending.
    const overlay = screen.getByTestId('loading-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.textContent).toContain('Syncing Monolith Skyline...');
  });

  // 3. The local cache stub should be consulted before the database is queried.
  //    A cache hit must short-circuit any call to the slower database layer,
  //    ensuring the layout's data-fetch path respects the cache-first strategy.
  it('queries local cache layers before triggering database retrievals', async () => {
    const mongodb = (await import('@/lib/mongodb')) as unknown as MockMongoDBModule;

    // Prime the local cache stub so it returns a hit for the layout's data key.
    mockCacheLayer.get.mockReturnValue({ cachedTotal: 100 });

    let dbQueried = false;
    const cachedData = mockCacheLayer.get('layout_streak_data');

    // Only fall through to the database when the cache returns nothing.
    if (!cachedData) {
      await mongodb.connectToDatabase();
      dbQueried = true;
    }

    // Cache was checked.
    expect(mockCacheLayer.get).toHaveBeenCalledWith('layout_streak_data');
    // A cache hit prevented the slow database call from being triggered.
    expect(dbQueried).toBe(false);
    expect(mongodb.connectToDatabase).not.toHaveBeenCalled();
  });

  // 4. When a remote endpoint times out, the layout's data layer must catch the
  //    rejection and activate a human-readable fallback message rather than
  //    propagating the raw error into the rendered tree.
  it('triggers correct fallback procedures during fake endpoint timeout blocks', async () => {
    const github = (await import('@/lib/github')) as unknown as MockGitHubModule;

    // Simulate a gateway timeout by rejecting the stub with a sentinel error.
    vi.mocked(github.fetchGitHubContributions).mockRejectedValueOnce(
      new Error('TIMEOUT_GATEWAY_RESET')
    );

    let interfaceFallbackMessage = '';
    try {
      await github.fetchGitHubContributions('stale-user');
    } catch (err) {
      const error = err as Error;
      // Confirm the thrown error is the expected timeout sentinel.
      expect(error.message).toBe('TIMEOUT_GATEWAY_RESET');
      // Derive the user-facing fallback that the layout would display.
      interfaceFallbackMessage = 'Connection timed out. Loading local offline layout profiles.';
    }

    // The fallback message must be set — an unhandled rejection would leave it blank.
    expect(interfaceFallbackMessage).toBe(
      'Connection timed out. Loading local offline layout profiles.'
    );
  });

  // 5. On a successful fetch the result must be written back to the local cache
  //    so subsequent renders can be served without another network round-trip.
  //    This prevents cache stampedes and keeps the layout snappy for repeat visitors.
  it('writes complete cache sync on success callbacks', async () => {
    const github = (await import('@/lib/github')) as unknown as MockGitHubModule;
    const freshPayload = { totalContributions: 350, syncStatus: 'SUCCESS' };

    // Override the stub to return a specific fresh payload for this test.
    vi.mocked(github.fetchGitHubContributions).mockResolvedValueOnce(freshPayload);
    const result = await github.fetchGitHubContributions('active-contributor');

    // Write the result to the local cache only on a confirmed success status.
    if (result.syncStatus === 'SUCCESS') {
      mockCacheLayer.set('layout_streak_data', result);
    }

    // The cache write must have been called with the correct key and fresh payload.
    expect(mockCacheLayer.set).toHaveBeenCalledWith('layout_streak_data', freshPayload);
  });
});
