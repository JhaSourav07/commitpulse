import { describe, it, expect, vi } from 'vitest';
import { TTLCache } from './cache';

/**
 * cache.accessibility.test.ts
 *
 * NOTE: `cache.ts` is a pure TypeScript server-side utility with no DOM, markup,
 * or UI layer. The "accessibility" label on this ticket is a shared template
 * applied uniformly across frontend and backend files.
 *
 * These five tests are therefore written to cover the behavioural contracts that
 * map most closely to the ticket's intent when applied to a cache module:
 *
 *  1. Role clarity   → every public method has a defined, predictable contract
 *                      (get returns null for missing/expired keys).
 *  2. Label fidelity → set() correctly enforces key identity rules so callers
 *                      always receive the value they labelled.
 *  3. Description     → has() accurately describes the live state of the cache
 *                      without mutating it beyond expiry cleanup.
 *  4. Focus / order  → the LRU-style eviction in set() removes the *oldest*
 *                      entry first, preserving insertion order semantics.
 *  5. Heading hierarchy → update() respects TTL hierarchy: it refreshes a value
 *                         without promoting or demoting the entry's expiry.
 */

describe('TTLCache – role clarity: get() returns null for absent and expired keys', () => {
  it('returns null on a cache miss and does not throw', () => {
    const cache = new TTLCache<string>();
    expect(cache.get('nonexistent')).toBeNull();
    cache.destroy();
  });

  it('returns null after a key has expired', async () => {
    vi.useFakeTimers();
    const cache = new TTLCache<string>();
    cache.set('session', 'active', 50);

    vi.advanceTimersByTime(51);

    expect(cache.get('session')).toBeNull();
    cache.destroy();
    vi.useRealTimers();
  });
});

describe('TTLCache – label fidelity: set() enforces key identity rules', () => {
  it('throws on an empty string key', () => {
    const cache = new TTLCache<number>();
    expect(() => cache.set('', 1, 1000)).toThrow('Cache key cannot be empty');
    cache.destroy();
  });

  it('throws on a non-positive ttlMs', () => {
    const cache = new TTLCache<number>();
    expect(() => cache.set('counter', 1, 0)).toThrow(RangeError);
    expect(() => cache.set('counter', 1, -100)).toThrow(RangeError);
    cache.destroy();
  });

  it('throws when key type is not a string', () => {
    const cache = new TTLCache<number>();
    // @ts-expect-error – deliberately testing runtime guard
    expect(() => cache.set(42, 1, 1000)).toThrow(TypeError);
    cache.destroy();
  });
});

describe('TTLCache – description accuracy: has() reflects live state without side-effects', () => {
  it('returns true for a live entry and false after expiry', () => {
    vi.useFakeTimers();
    const cache = new TTLCache<string>();
    cache.set('token', 'abc', 200);

    expect(cache.has('token')).toBe(true);

    vi.advanceTimersByTime(201);
    expect(cache.has('token')).toBe(false);

    cache.destroy();
    vi.useRealTimers();
  });

  it('does not affect a live entry when has() is called repeatedly', () => {
    const cache = new TTLCache<string>();
    cache.set('key', 'value', 60_000);

    for (let i = 0; i < 10; i++) {
      expect(cache.has('key')).toBe(true);
    }
    // Value must still be retrievable after repeated has() calls
    expect(cache.get('key')).toBe('value');
    cache.destroy();
  });
});

describe('TTLCache – focus/order: eviction removes the oldest entry first', () => {
  it('evicts the first-inserted key when maxSize is reached and no entries are expired', () => {
    vi.useFakeTimers();
    const cache = new TTLCache<string>(3);

    cache.set('first', 'a', 60_000);
    vi.advanceTimersByTime(1); // ensure insertion order: first < second < third
    cache.set('second', 'b', 60_000);
    vi.advanceTimersByTime(1);
    cache.set('third', 'c', 60_000);
    vi.advanceTimersByTime(1);

    // Adding a fourth entry must evict 'first'
    cache.set('fourth', 'd', 60_000);

    expect(cache.get('first')).toBeNull();
    expect(cache.get('second')).toBe('b');
    expect(cache.get('third')).toBe('c');
    expect(cache.get('fourth')).toBe('d');

    cache.destroy();
    vi.useRealTimers();
  });
});

describe('TTLCache – heading hierarchy: update() preserves TTL without re-promoting the entry', () => {
  it('updates value but leaves expiry unchanged', () => {
    vi.useFakeTimers();
    const cache = new TTLCache<string>();
    cache.set('config', 'v1', 500);

    vi.advanceTimersByTime(300); // 300 ms elapsed; 200 ms remain
    const updated = cache.update('config', 'v2');
    expect(updated).toBe(true);
    expect(cache.get('config')).toBe('v2');

    // Advance past the *original* expiry (200 ms more)
    vi.advanceTimersByTime(201);
    // If update() had reset the TTL the entry would still be alive – it should not be
    expect(cache.get('config')).toBeNull();

    cache.destroy();
    vi.useRealTimers();
  });

  it('returns false and does not create the entry when key is absent', () => {
    const cache = new TTLCache<string>();
    const result = cache.update('ghost', 'value');
    expect(result).toBe(false);
    expect(cache.has('ghost')).toBe(false);
    cache.destroy();
  });
});
