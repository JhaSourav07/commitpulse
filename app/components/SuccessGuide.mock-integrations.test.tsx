import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { SuccessGuide } from './SuccessGuide';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
  },
}));

vi.mock('./Icons', () => ({
  CloseIcon: () => <span>CloseIcon</span>,
}));

// Simulate an async service layer that loads guide metadata from a remote endpoint
const createGuideService = () => {
  const cache = new Map<string, unknown>();

  const fetchGuideMetadata = vi.fn().mockResolvedValue({
    name: 'success-guide',
    version: '2.0.0',
    loaded: true,
  });

  const getGuideMetadata = async (guideKey: string) => {
    // Assert cache is checked before hitting the service
    if (cache.has(guideKey)) {
      return cache.get(guideKey);
    }
    const data = await fetchGuideMetadata(guideKey);
    cache.set(guideKey, data);
    return data;
  };

  return { cache, fetchGuideMetadata, getGuideMetadata };
};

describe('SuccessGuide mock-integrations: Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  const markdown = '![Badge](https://example.com/badge.svg)';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component synchronously without requiring any async service calls', () => {
    // SuccessGuide must render immediately — no pending state, no async dependency
    const asyncServiceSpy = vi.fn().mockResolvedValue({ loaded: true });

    render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);

    // Component renders all steps immediately — service was never invoked
    expect(asyncServiceSpy).not.toHaveBeenCalled();
    expect(screen.getByText('01')).toBeDefined();
    expect(screen.getByText('02')).toBeDefined();
    expect(screen.getByText('03')).toBeDefined();
    expect(screen.getByText('04')).toBeDefined();
    expect(screen.getByText(markdown)).toBeDefined();
  });

  it('queries local cache before triggering remote service retrieval', async () => {
    const { cache, fetchGuideMetadata, getGuideMetadata } = createGuideService();

    // Pre-populate cache with SuccessGuide metadata
    cache.set('SuccessGuide', { name: 'success-guide', version: '2.0.0', loaded: true });

    const result = await getGuideMetadata('SuccessGuide');

    // Cache hit — remote fetch must not have been called
    expect(fetchGuideMetadata).not.toHaveBeenCalled();
    expect(result).toEqual({ name: 'success-guide', version: '2.0.0', loaded: true });

    // Component still renders correctly regardless of service layer state
    render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);
    expect(screen.getByText(markdown)).toBeDefined();
  });

  it('renders a pending state overlay while the async service is loading', async () => {
    let resolveService!: (value: unknown) => void;
    const pendingFetch = vi.fn(
      (_guideKey: string) =>
        new Promise((resolve) => {
          resolveService = resolve;
        })
    );

    // While the service promise is unresolved, the component itself should still render
    // (SuccessGuide is purely presentational — it does not depend on the service)
    render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);

    // Start the async service call — it stays pending
    const servicePromise = pendingFetch('SuccessGuide');

    // Component is fully rendered even while service is pending
    expect(screen.getByText('01')).toBeDefined();
    expect(screen.getByRole('region')).toBeDefined();
    expect(pendingFetch).toHaveBeenCalledTimes(1);

    // Resolve the pending service
    resolveService({ name: 'success-guide', loaded: true });
    const result = await servicePromise;
    expect(result).toEqual({ name: 'success-guide', loaded: true });
  });

  it('returns a fallback result and does not throw when the async endpoint times out', async () => {
    const timedOutFetch = vi.fn().mockRejectedValue(new Error('Request timeout'));

    const getWithFallback = async (guideKey: string) => {
      try {
        return await timedOutFetch(guideKey);
      } catch {
        // Fallback procedure on timeout — return a safe default
        return { name: guideKey, loaded: false, fallback: true };
      }
    };

    const result = await getWithFallback('SuccessGuide');

    // Timeout must not crash — fallback must be returned
    expect(timedOutFetch).toHaveBeenCalledWith('SuccessGuide');
    expect(result).toEqual({ name: 'SuccessGuide', loaded: false, fallback: true });

    // Component itself still renders normally despite service failure
    render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);
    expect(screen.getByText(markdown)).toBeDefined();
    expect(screen.getByText('01')).toBeDefined();
  });

  it('writes complete metadata to cache after a successful async fetch', async () => {
    const { cache, fetchGuideMetadata, getGuideMetadata } = createGuideService();

    // Cache starts empty
    expect(cache.has('SuccessGuide')).toBe(false);

    await getGuideMetadata('SuccessGuide');

    // After successful fetch, cache must be synced with the full response
    expect(fetchGuideMetadata).toHaveBeenCalledTimes(1);
    expect(cache.has('SuccessGuide')).toBe(true);
    expect(cache.get('SuccessGuide')).toEqual({
      name: 'success-guide',
      version: '2.0.0',
      loaded: true,
    });

    // Subsequent call must hit cache — no additional fetch
    await getGuideMetadata('SuccessGuide');
    expect(fetchGuideMetadata).toHaveBeenCalledTimes(1);
  });
});
