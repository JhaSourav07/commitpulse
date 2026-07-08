import { render, screen, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import React, { useState, useEffect } from 'react';
import '@testing-library/jest-dom/vitest';
import { GeneratorClient } from './GeneratorClient';
import type { GeneratorState } from './types';

// In-memory cache layer for testing
const localCache = new Map<string, GeneratorState>();

const stubState: GeneratorState = {
  name: 'Database User',
  description: 'Fetched from DB',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: 'dbuser',
  showCommitPulse: false,
  commitPulseAccent: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
  showRepoSpotlight: false,
  spotlightRepo: '',
};

// Database stub
const fetchFromDatabase = vi.fn(async (username: string): Promise<GeneratorState> => {
  return new Promise((resolve, reject) => {
    if (username === 'timeout') {
      setTimeout(() => reject(new Error('Endpoint timeout')), 100);
    } else {
      setTimeout(() => resolve({ ...stubState, githubUsername: username }), 50);
    }
  });
});

// Async Service Layer
const loadState = async (username: string): Promise<GeneratorState> => {
  if (localCache.has(username)) {
    return localCache.get(username)!;
  }
  const result = await fetchFromDatabase(username);
  localCache.set(username, result);
  return result;
};

// Wrapper Component that uses the service layer
function AsyncGeneratorWrapper({ username }: { username: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    loadState(username)
      .then(() => {
        if (mounted) setLoading(false);
      })
      .catch((err) => {
        if (mounted) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Unknown error');
          }
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [username]);

  if (loading) {
    return <div data-testid="pending-overlay">Loading service...</div>;
  }

  if (error) {
    return <div data-testid="fallback-ui">Fallback: {error}</div>;
  }

  return <GeneratorClient />;
}

describe('GeneratorClient - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    localCache.clear();
    fetchFromDatabase.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Case 1: mocks standard asynchronous imports and databases using stubs', async () => {
    const promise = fetchFromDatabase('testuser');
    vi.advanceTimersByTime(50);
    const result = await promise;
    expect(result.githubUsername).toBe('testuser');
    expect(fetchFromDatabase).toHaveBeenCalledWith('testuser');
  });

  it('Case 2: tests service loading paths to ensure pending state overlays render', () => {
    render(<AsyncGeneratorWrapper username="testuser" />);
    // Should render the pending overlay initially
    expect(screen.getByTestId('pending-overlay')).toBeInTheDocument();
  });

  it('Case 3: asserts local cache layers are queried before triggering database retrievals', async () => {
    // Prime the cache
    localCache.set('cacheduser', { ...stubState, name: 'Cached Name' });

    render(<AsyncGeneratorWrapper username="cacheduser" />);

    // Cache is synchronous, so it should resolve immediately
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchFromDatabase).not.toHaveBeenCalled();
    expect(screen.queryByTestId('pending-overlay')).not.toBeInTheDocument();
    // Verify GeneratorClient rendered
    expect(screen.getByRole('form', { name: /Readme Configuration Editor/i })).toBeInTheDocument();
  });

  it('Case 4: verifies correct fallback procedures during fake endpoint timeout blocks', async () => {
    render(<AsyncGeneratorWrapper username="timeout" />);

    expect(screen.getByTestId('pending-overlay')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('fallback-ui')).toBeInTheDocument();
    expect(screen.getByText('Fallback: Endpoint timeout')).toBeInTheDocument();
  });

  it('Case 5: asserts complete cache sync is written on success callbacks', async () => {
    expect(localCache.has('syncuser')).toBe(false);

    render(<AsyncGeneratorWrapper username="syncuser" />);

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(localCache.has('syncuser')).toBe(true);
    expect(localCache.get('syncuser')?.githubUsername).toBe('syncuser');
  });
});
