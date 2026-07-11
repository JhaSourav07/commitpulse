import React, { useState, useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { NameSection } from './NameSection';
import type { HTMLAttributes, ReactNode } from 'react';

// Mock framer-motion directly to pure HTML elements
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Local cache stub for testing
const localCache = new Map<string, string>();

// Database/API stub function
const mockDbFetch = vi.fn<(username: string) => Promise<string>>();

// Service Layer Loader with caching and timeout support
async function loadName(username: string, timeoutMs = 500): Promise<string> {
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

// React component wrapping the loader and NameSection
const AsyncNameSectionLoader = ({
  username,
  fallbackName,
}: {
  username: string;
  fallbackName: string;
}) => {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    loadName(username)
      .then((data) => {
        setName(data);
      })
      .catch((err: Error) => {
        setError(err.message);
        setName(fallbackName);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username, fallbackName]);

  // Test service loading paths to ensure pending state overlays render
  if (loading) {
    return <div data-testid="loading-overlay">Loading name...</div>;
  }

  // Verify correct fallback procedures during fake endpoint timeout blocks
  if (error) {
    return (
      <div data-testid="error-overlay">
        <span>{error}</span>
        <NameSection value={name || ''} onChange={(val) => setName(val)} />
      </div>
    );
  }

  return <NameSection value={name || ''} onChange={(val) => setName(val)} />;
};

describe('NameSection - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localCache.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mocks standard asynchronous imports and databases using stubs', async () => {
    mockDbFetch.mockResolvedValue('Alice');
    const result = await loadName('user1');
    expect(mockDbFetch).toHaveBeenCalledWith('user1');
    expect(result).toBe('Alice');
  });

  it('tests service loading paths to ensure pending state overlays render', async () => {
    let resolvePromise: (val: string) => void = () => {};
    const pendingPromise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });
    mockDbFetch.mockReturnValue(pendingPromise);

    render(<AsyncNameSectionLoader username="user2" fallbackName="Default Name" />);

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();

    await act(async () => {
      resolvePromise('Bob');
    });

    expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Omkar')).toHaveValue('Bob');
  });

  it('asserts local cache layers are queried before triggering database retrievals', async () => {
    localCache.set('user3', 'Cached Name');

    const result = await loadName('user3');

    expect(mockDbFetch).not.toHaveBeenCalled();
    expect(result).toBe('Cached Name');
  });

  it('verifies correct fallback procedures during fake endpoint timeout blocks', async () => {
    const infinitePromise = new Promise<string>(() => {});
    mockDbFetch.mockReturnValue(infinitePromise);

    vi.useFakeTimers();

    render(<AsyncNameSectionLoader username="user4" fallbackName="Fallback Name" />);

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    expect(screen.getByTestId('error-overlay')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Omkar')).toHaveValue('Fallback Name');
  });

  it('asserts complete cache sync is written on success callbacks', async () => {
    mockDbFetch.mockResolvedValue('Charlie');

    expect(localCache.has('user5')).toBe(false);

    await loadName('user5');

    expect(localCache.has('user5')).toBe(true);
    expect(localCache.get('user5')).toBe('Charlie');
  });
});
