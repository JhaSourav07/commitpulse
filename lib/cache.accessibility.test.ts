import { describe, it, expect, vi, afterEach } from 'vitest';
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
 *  1. Role clarity      → get() has a defined, predictable contract
 *                         (returns null for missing/expired keys).
 *  2. Label fidelity    → set() enforces key identity rules so callers
 *                         always receive the value they labelled.
 *  3. Description       → has() accurately describes the live state of the cache
 *                         without mutating it beyond expiry cleanup.
 *  4. Focus / order     → eviction in set() removes the *oldest* entry first,
 *                         preserving insertion-order semantics.
 *  5. Heading hierarchy → update() respects TTL hierarchy: it refreshes a value
 *                         without promoting or demoting the entry's expiry.
 */

// ---------------------------------------------------------------------------
// 1. Role clarity – get() returns null for absent and expired keys
// ---------------------------------------------------------------------------
describe('TTLCache – role clarity: get() returns null for absent and expired keys', () => {
  let cache: TTLCache<string>;

  afterEach(() => {
    cache.destroy();
    vi.useRealTimers();
  });

  it('returns null on a cache miss and does not throw', () => {
    cache = new TTLCache<string>();
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('returns null after a key has expired', () => {
    vi.useFakeTimers();
    cache = new TTLCache<string>();
    cache.set('session', 'active', 50);

    vi.advanceTimersByTime(51);

    expect(cache.get('session')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. Label fidelity – set() enforces key identity rules
// ---------------------------------------------------------------------------
describe('TTLCache – label fidelity: set() enforces key identity rules', () => {
  let cache: TTLCache<number>;

  afterEach(() => {
    cache.destroy();
  });

  it('throws on an empty string key', () => {
    cache = new TTLCache<number>();
    expect(() => cache.set('', 1, 1000)).toThrow('Cache key cannot be empty');
  });

  it('throws on a non-positive ttlMs', () => {
    cache = new TTLCache<number>();
    expect(() => cache.set('counter', 1, 0)).toThrow(RangeError);
    expect(() => cache.set('counter', 1, -100)).toThrow(RangeError);
  });

  it('throws when key type is not a string', () => {
    cache = new TTLCache<number>();
    // @ts-expect-error – deliberately testing runtime guard
    expect(() => cache.set(42, 1, 1000)).toThrow(TypeError);
  });
});

// ---------------------------------------------------------------------------
// 3. Description accuracy – has() reflects live state without side-effects
// ---------------------------------------------------------------------------
describe('TTLCache – description accuracy: has() reflects live state without side-effects', () => {
  let cache: TTLCache<string>;

  afterEach(() => {
    cache.destroy();
    vi.useRealTimers();
  });

  it('returns true for a live entry and false after expiry', () => {
    vi.useFakeTimers();
    cache = new TTLCache<string>();
    cache.set('token', 'abc', 200);

    expect(cache.has('token')).toBe(true);

    vi.advanceTimersByTime(201);
    expect(cache.has('token')).toBe(false);
  });

  it('does not affect a live entry when has() is called repeatedly', () => {
    cache = new TTLCache<string>();
    cache.set('key', 'value', 60_000);

    for (let i = 0; i < 10; i++) {
      expect(cache.has('key')).toBe(true);
    }
    // Value must still be retrievable after repeated has() calls
    expect(cache.get('key')).toBe('value');
  });
});

// ---------------------------------------------------------------------------
// 4. Focus / order – eviction removes the oldest entry first
// ---------------------------------------------------------------------------
describe('TTLCache – focus/order: eviction removes the oldest entry first', () => {
  let cache: TTLCache<string>;

  afterEach(() => {
    cache.destroy();
    vi.useRealTimers();
  });

  it('evicts the first-inserted key when maxSize is reached and no entries are expired', () => {
    vi.useFakeTimers();
    cache = new TTLCache<string>(3);

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
  });
});

// ---------------------------------------------------------------------------
// 5. Heading hierarchy – update() preserves TTL without re-promoting the entry
// ---------------------------------------------------------------------------
describe('TTLCache – heading hierarchy: update() preserves TTL without re-promoting the entry', () => {
  let cache: TTLCache<string>;

  afterEach(() => {
    cache.destroy();
    vi.useRealTimers();
  });

  it('updates value but leaves expiry unchanged', () => {
    vi.useFakeTimers();
    cache = new TTLCache<string>();
    cache.set('config', 'v1', 500);

    vi.advanceTimersByTime(300); // 300 ms elapsed; 200 ms remain
    const updated = cache.update('config', 'v2');
    expect(updated).toBe(true);
    expect(cache.get('config')).toBe('v2');

    // Advance past the *original* expiry (200 ms more)
    vi.advanceTimersByTime(201);
    // If update() had reset the TTL the entry would still be alive – it must not
    expect(cache.get('config')).toBeNull();
  });

  it('returns false and does not create the entry when key is absent', () => {
    cache = new TTLCache<string>();
    const result = cache.update('ghost', 'value');
    expect(result).toBe(false);
    expect(cache.has('ghost')).toBe(false);
  });
});
