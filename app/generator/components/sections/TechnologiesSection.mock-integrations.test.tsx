import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React, { useState, useEffect } from 'react';
import { TechnologiesSection } from './TechnologiesSection';

// ----------------------------------------------------------------------
// Mocks for Asynchronous Service Layer & Local Cache Stubs
// ----------------------------------------------------------------------

const mockCache = new Map<string, string[]>();

const mockFetchFromDatabase = vi.fn(async (simulateTimeout = false): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    if (simulateTimeout) {
      setTimeout(() => reject(new Error('Endpoint timeout')), 100);
    } else {
      setTimeout(() => resolve(['react', 'typescript', 'tailwindcss']), 50);
    }
  });
});

// A wrapper component that simulates fetching the initial selected technologies
// from a remote database/cache before rendering the actual TechnologiesSection.
function TechnologiesSectionAsyncWrapper({
  simulateTimeout = false,
}: {
  simulateTimeout?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(false);

      try {
        // Assert local cache layers are queried before triggering database retrievals
        if (mockCache.has('user-tech-stack')) {
          if (isMounted) {
            setSelected(mockCache.get('user-tech-stack')!);
            setLoading(false);
          }
          return;
        }

        const data = await mockFetchFromDatabase(simulateTimeout);

        // Assert complete cache sync is written on success callbacks
        mockCache.set('user-tech-stack', data);

        if (isMounted) {
          setSelected(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          // Verify correct fallback procedures during fake endpoint timeout blocks
          setError(true);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [simulateTimeout]);

  if (loading) return <div data-testid="pending-state-overlay">Loading async data...</div>;
  if (error) return <div data-testid="fallback-state">Fallback: Offline Mode</div>;

  return <TechnologiesSection selected={selected} onChange={setSelected} />;
}

describe('Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Mock standard asynchronous imports and databases using stubs', async () => {
    render(<TechnologiesSectionAsyncWrapper />);

    // The stub is called
    expect(mockFetchFromDatabase).toHaveBeenCalledTimes(1);

    // Wait for the async component to resolve
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Should render the main component safely
    expect(screen.getByText('Technologies')).toBeTruthy();
  });

  it('2. Test service loading paths to ensure pending state overlays render', () => {
    render(<TechnologiesSectionAsyncWrapper />);

    // Pending state overlay should be visible immediately before async resolves
    const pendingOverlay = screen.getByTestId('pending-state-overlay');
    expect(pendingOverlay).toBeTruthy();
  });

  it('3. Assert local cache layers are queried before triggering database retrievals', async () => {
    // Pre-populate the cache stub
    mockCache.set('user-tech-stack', ['vuejs', 'nodejs']);

    render(<TechnologiesSectionAsyncWrapper />);

    // Because cache was hit, it should NOT trigger database retrievals
    expect(mockFetchFromDatabase).not.toHaveBeenCalled();

    // It immediately resolves from cache, so component renders synchronously
    expect(screen.queryByTestId('pending-state-overlay')).toBeNull();

    // We expect the 'selected' tech from the cache to be reflected in the UI badge
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // The "Selected (2)" badge should be visible indicating the cache data was loaded
    expect(screen.getByText('Selected (2)')).toBeTruthy();
  });

  it('4. Verify correct fallback procedures during fake endpoint timeout blocks', async () => {
    render(<TechnologiesSectionAsyncWrapper simulateTimeout={true} />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Ensure fallback overlay renders due to endpoint timeout
    const fallback = screen.getByTestId('fallback-state');
    expect(fallback).toBeTruthy();
    expect(fallback.textContent).toContain('Fallback: Offline Mode');
  });

  it('5. Assert complete cache sync is written on success callbacks', async () => {
    // Assert empty start state
    expect(mockCache.has('user-tech-stack')).toBe(false);

    render(<TechnologiesSectionAsyncWrapper />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Database retrieval succeeds and populates the local cache layer sync
    expect(mockCache.has('user-tech-stack')).toBe(true);
    expect(mockCache.get('user-tech-stack')).toEqual(['react', 'typescript', 'tailwindcss']);
  });
});
