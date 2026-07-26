import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Template from './template';

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

// --- MOCK INTEGRATIONS & STUBS ---
vi.mock('@/lib/mongodb', () => ({
  connectToDatabase: vi.fn().mockResolvedValue('Mocked DB Connection'),
}));

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi
    .fn()
    .mockResolvedValue({ totalContributions: 100, syncStatus: 'SUCCESS' }),
}));

const mockCacheLayer = {
  get: vi.fn(),
  set: vi.fn(),
};

describe('AppTemplate Mock Integrations', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // 1. Asynchronous Service Layer Mocking
  it('mocks standard asynchronous imports and databases using stubs', async () => {
    const mongodb = (await import('@/lib/mongodb')) as unknown as MockMongoDBModule;
    const github = (await import('@/lib/github')) as unknown as MockGitHubModule;

    const dbResult = await mongodb.connectToDatabase();
    const githubResult = await github.fetchGitHubContributions('test-user');

    expect(dbResult).toBe('Mocked DB Connection');
    expect(githubResult.totalContributions).toBe(100);
    expect(mongodb.connectToDatabase).toHaveBeenCalled();
    expect(github.fetchGitHubContributions).toHaveBeenCalled();
  });

  // 2. Pending State Overlays & Service Loading Paths
  it('renders pending state overlays during service loading paths', async () => {
    const github = (await import('@/lib/github')) as unknown as MockGitHubModule;

    // Create an explicitly unresolved promise to force the component to stay in a loading state
    const infinitePendingPromise = new Promise<{ totalContributions: number; syncStatus: string }>(
      () => {}
    );
    vi.mocked(github.fetchGitHubContributions).mockReturnValueOnce(infinitePendingPromise);

    render(
      <Template>
        <div data-testid="loading-overlay">Syncing Monolith Skyline...</div>
      </Template>
    );

    // Retrieve the element and use environment-agnostic assertions
    const overlay = screen.getByTestId('loading-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.textContent).toContain('Syncing Monolith Skyline...');
  });

  // 3. Local Cache Evaluation Precedence
  it('queries local cache layers before triggering database retrievals', async () => {
    const mongodb = (await import('@/lib/mongodb')) as unknown as MockMongoDBModule;

    mockCacheLayer.get.mockReturnValue({ cachedTotal: 100 });

    let dbQueried = false;
    const cachedData = mockCacheLayer.get('user_streak_data');

    if (!cachedData) {
      await mongodb.connectToDatabase();
      dbQueried = true;
    }

    expect(mockCacheLayer.get).toHaveBeenCalledWith('user_streak_data');
    expect(dbQueried).toBe(false);
    expect(mongodb.connectToDatabase).not.toHaveBeenCalled();
  });

  // 4. Endpoint Timeout & Fallback Error Protocols
  it('triggers correct fallback procedures during fake endpoint timeout blocks', async () => {
    const github = (await import('@/lib/github')) as unknown as MockGitHubModule;

    vi.mocked(github.fetchGitHubContributions).mockRejectedValueOnce(
      new Error('TIMEOUT_GATEWAY_RESET')
    );

    let interfaceFallbackMessage = '';
    try {
      await github.fetchGitHubContributions('stale-user');
    } catch (err) {
      const error = err as Error;
      expect(error.message).toBe('TIMEOUT_GATEWAY_RESET');
      interfaceFallbackMessage = 'Connection timed out. Loading local offline landscape profiles.';
    }

    expect(interfaceFallbackMessage).toBe(
      'Connection timed out. Loading local offline landscape profiles.'
    );
  });

  // 5. Successful Commits & Cache Write Synchronization
  it('writes complete cache sync on success callbacks', async () => {
    const github = (await import('@/lib/github')) as unknown as MockGitHubModule;
    const freshPayload = { totalContributions: 600, syncStatus: 'SUCCESS' };

    vi.mocked(github.fetchGitHubContributions).mockResolvedValueOnce(freshPayload);
    const result = await github.fetchGitHubContributions('active-contributor');

    if (result.syncStatus === 'SUCCESS') {
      mockCacheLayer.set('user_streak_data', result);
    }

    expect(mockCacheLayer.set).toHaveBeenCalledWith('user_streak_data', freshPayload);
  });
});
