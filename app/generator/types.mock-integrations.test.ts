import React, { useState, useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import type { GeneratorState } from './types';

// In-memory cache layer for testing
const localCache = new Map<string, GeneratorState>();

// Async database/API simulator
const mockDbFetch = vi.fn<(username: string) => Promise<GeneratorState>>();

// Service Layer Loader with caching and timeout support
async function loadState(username: string, timeoutMs = 500): Promise<GeneratorState> {
  // Assert local cache layers are queried before triggering database retrievals
  if (localCache.has(username)) {
    return localCache.get(username)!;
  }

  // Database retrieval with a timeout race
  const fetchPromise = mockDbFetch(username);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Endpoint timeout block')), timeoutMs)
  );

  const result = await Promise.race([fetchPromise, timeoutPromise]);

  // Assert complete cache sync is written on success callbacks
  localCache.set(username, result);
  return result;
}

// React component wrapping the loader
const AsyncStateLoader = ({
  username,
  fallbackState,
}: {
  username: string;
  fallbackState: GeneratorState;
}) => {
  const [state, setState] = useState<GeneratorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    loadState(username)
      .then((data) => {
        setState(data);
      })
      .catch((err: Error) => {
        setError(err.message);
        setState(fallbackState);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username, fallbackState]);

  if (loading) {
    return React.createElement('div', { 'data-testid': 'loading-overlay' }, 'Loading state...');
  }

  if (error) {
    return React.createElement('div', { 'data-testid': 'error-overlay' }, [
      React.createElement('span', { key: 'err' }, error),
      React.createElement('span', { key: 'name', 'data-testid': 'state-name' }, state?.name),
    ]);
  }

  return React.createElement('div', { 'data-testid': 'state-name' }, state?.name);
};

describe('GeneratorTypes - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  const fallbackState: GeneratorState = {
    name: 'Fallback User',
    description: 'Static Description',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
    githubUsername: 'fallback',
    showCommitPulse: false,
    commitPulseAccent: '#cccccc',
    showRepoSpotlight: false,
    spotlightRepo: '',
    showSnakeGraph: false,
    showPacmanGraph: false,
    graphPlacement: 'bottom',
  };

  const successState: GeneratorState = {
    name: 'Successful User',
    description: 'Success Description',
    selectedTechs: ['react'],
    selectedSocials: ['github'],
    socialLinks: { github: 'github.com/success' },
    githubUsername: 'success',
    showCommitPulse: true,
    commitPulseAccent: '#ff0055',
    showRepoSpotlight: false,
    spotlightRepo: '',
    showSnakeGraph: true,
    showPacmanGraph: false,
    graphPlacement: 'middle',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localCache.clear();
  });

  it('Case 1: mock standard asynchronous service layer and databases using stubs', async () => {
    mockDbFetch.mockResolvedValue(successState);
    const result = await loadState('testuser');

    expect(mockDbFetch).toHaveBeenCalledWith('testuser');
    expect(result).toEqual(successState);
  });

  it('Case 2: test service loading paths to ensure pending state overlays render', async () => {
    let resolvePromise: (val: GeneratorState) => void = () => {};
    const pendingPromise = new Promise<GeneratorState>((resolve) => {
      resolvePromise = resolve;
    });
    mockDbFetch.mockReturnValue(pendingPromise);

    render(React.createElement(AsyncStateLoader, { username: 'pendinguser', fallbackState }));

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();

    await act(async () => {
      resolvePromise(successState);
    });

    expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    expect(screen.getByTestId('state-name')).toHaveTextContent('Successful User');
  });

  it('Case 3: assert local cache layers are queried before triggering database retrievals', async () => {
    const cachedState: GeneratorState = { ...successState, name: 'Cached User' };
    localCache.set('cacheduser', cachedState);

    const result = await loadState('cacheduser');

    expect(mockDbFetch).not.toHaveBeenCalled();
    expect(result.name).toBe('Cached User');
  });

  it('Case 4: verify correct fallback procedures during fake endpoint timeout blocks', async () => {
    // Force database call to hang, triggering local timeout race
    const infinitePromise = new Promise<GeneratorState>(() => {});
    mockDbFetch.mockReturnValue(infinitePromise);

    vi.useFakeTimers();

    render(React.createElement(AsyncStateLoader, { username: 'timeoutuser', fallbackState }));

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    vi.useRealTimers();

    expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    expect(screen.getByTestId('error-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('state-name')).toHaveTextContent('Fallback User');
  });

  it('Case 5: assert complete cache sync is written on success callbacks', async () => {
    mockDbFetch.mockResolvedValue(successState);

    expect(localCache.has('syncuser')).toBe(false);

    await loadState('syncuser');

    expect(localCache.has('syncuser')).toBe(true);
    expect(localCache.get('syncuser')).toEqual(successState);
  });
});
