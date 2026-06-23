import { describe, it, expect } from 'vitest';
import { TTLCache } from './cache';

describe('TTLCache Empty Fallback Verification', () => {
  it('returns null when reading from a completely empty cache', () => {
    const cache = new TTLCache<string>();

    expect(cache.get('missing-key')).toBeNull();

    cache.destroy();
  });

  it('returns false when checking existence of a missing key', () => {
    const cache = new TTLCache<string>();

    expect(cache.has('missing-key')).toBe(false);

    cache.destroy();
  });

  it('returns empty state after clear() removes all entries', () => {
    const cache = new TTLCache<string>();

    cache.set('user', 'octocat', 60_000);
    cache.clear();

    expect(cache.size()).toBe(0);
    expect(cache.get('user')).toBeNull();

    cache.destroy();
  });

  it('handles empty array values without runtime errors', () => {
    const cache = new TTLCache<string[]>();

    cache.set('repos', [], 60_000);

    expect(cache.get('repos')).toEqual([]);
    expect(cache.get('repos')).toHaveLength(0);

    cache.destroy();
  });

  it('handles null values safely as fallback data', () => {
    const cache = new TTLCache<string | null>();

    cache.set('profile', null, 60_000);

    expect(cache.get('profile')).toBeNull();
    expect(cache.has('profile')).toBe(true);

    cache.destroy();
  });
});
