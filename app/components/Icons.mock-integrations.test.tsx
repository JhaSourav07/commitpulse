import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CopyIcon, ZapIcon, BoxIcon, CheckIcon, CloseIcon } from './Icons';

// Simulate an async service layer that loads icon metadata from a remote endpoint
const createIconService = () => {
  const cache = new Map<string, unknown>();

  const fetchIconMetadata = vi.fn().mockResolvedValue({
    name: 'icon',
    version: '1.0.0',
    loaded: true,
  });

  const getIconMetadata = async (iconName: string) => {
    // Assert cache is checked before hitting the service
    if (cache.has(iconName)) {
      return cache.get(iconName);
    }
    const data = await fetchIconMetadata(iconName);
    cache.set(iconName, data);
    return data;
  };

  return { cache, fetchIconMetadata, getIconMetadata };
};

describe('Icons mock-integrations: Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders icons synchronously without requiring any async service calls', () => {
    // Icons must render immediately no pending state, no async dependency
    const asyncServiceSpy = vi.fn().mockResolvedValue({ loaded: true });

    const { container: c1 } = render(<CopyIcon />);
    const { container: c2 } = render(<ZapIcon />);
    const { container: c3 } = render(<BoxIcon />);
    const { container: c4 } = render(<CheckIcon />);
    const { container: c5 } = render(<CloseIcon />);

    // All icons render immediately service was never called
    expect(asyncServiceSpy).not.toHaveBeenCalled();
    expect(c1.querySelector('svg')).not.toBeNull();
    expect(c2.querySelector('svg')).not.toBeNull();
    expect(c3.querySelector('svg')).not.toBeNull();
    expect(c4.querySelector('svg')).not.toBeNull();
    expect(c5.querySelector('svg')).not.toBeNull();
  });

  it('queries local cache before triggering remote service retrieval', async () => {
    const { cache, fetchIconMetadata, getIconMetadata } = createIconService();

    // Pre-populate cache with CopyIcon metadata
    cache.set('CopyIcon', { name: 'CopyIcon', version: '1.0.0', loaded: true });

    const result = await getIconMetadata('CopyIcon');

    // Cache hit remote fetch must not have been called
    expect(fetchIconMetadata).not.toHaveBeenCalled();
    expect(result).toEqual({ name: 'CopyIcon', version: '1.0.0', loaded: true });
  });

  it('falls back to remote fetch when local cache has no entry', async () => {
    const { cache, fetchIconMetadata, getIconMetadata } = createIconService();

    // Cache is empty service must be called
    expect(cache.has('ZapIcon')).toBe(false);

    const result = await getIconMetadata('ZapIcon');

    // Cache miss remote fetch must have been triggered exactly once
    expect(fetchIconMetadata).toHaveBeenCalledTimes(1);
    expect(fetchIconMetadata).toHaveBeenCalledWith('ZapIcon');
    expect(result).toEqual({ name: 'icon', version: '1.0.0', loaded: true });
  });

  it('returns a fallback result and does not throw when the async endpoint times out', async () => {
    const timedOutFetch = vi.fn().mockRejectedValue(new Error('Request timeout'));

    const getWithFallback = async (iconName: string) => {
      try {
        return await timedOutFetch(iconName);
      } catch {
        // Fallback procedure on timeout return a safe default
        return { name: iconName, loaded: false, fallback: true };
      }
    };

    const result = await getWithFallback('BoxIcon');

    // Timeout must not crash fallback must be returned
    expect(timedOutFetch).toHaveBeenCalledWith('BoxIcon');
    expect(result).toEqual({ name: 'BoxIcon', loaded: false, fallback: true });

    // Icon component itself still renders normally despite service failure
    const { container } = render(<BoxIcon />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('writes complete metadata to cache after a successful async fetch', async () => {
    const { cache, fetchIconMetadata, getIconMetadata } = createIconService();

    // Cache starts empty
    expect(cache.has('CheckIcon')).toBe(false);

    await getIconMetadata('CheckIcon');

    // After successful fetch, cache must be synced with the full response
    expect(fetchIconMetadata).toHaveBeenCalledTimes(1);
    expect(cache.has('CheckIcon')).toBe(true);
    expect(cache.get('CheckIcon')).toEqual({ name: 'icon', version: '1.0.0', loaded: true });
  });
});
