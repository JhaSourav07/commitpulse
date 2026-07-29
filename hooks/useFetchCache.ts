/**
 * A lightweight, in-memory fetch cache hook for React components.
 *
 * Stores the most recently fetched data keyed by a string identifier, with a
 * hard cap of 10 entries and LRU-like eviction of the oldest entry when the
 * limit is reached. The cache lives in a `useRef` so it survives re-renders
 * without causing additional renders itself.
 *
 * @note
 * This cache is component-scoped (each consumer gets its own instance) and is
 * not shared across components or preserved across page navigations. For
 * application-level caching, prefer `lib/cache.ts` which uses a TTL and
 * supports distributed scenarios.
 */

import { useRef } from 'react';

/**
 * Cache operations returned by `useFetchCache`.
 *
 * @template T - The type of cached values.
 */
export interface FetchCacheOperations<T> {
  /** Returns the cached value for `key`, or `undefined` if not present. */
  get: (key: string) => T | undefined;
  /** Stores `value` under `key`. Evicts the oldest entry if the 10-entry cap is reached. */
  set: (key: string, value: T) => void;
  /** Returns `true` if a value is cached for `key`. */
  has: (key: string) => boolean;
  /** Clears all cached entries. */
  clear: () => void;
}

/**
 * A React hook that provides a simple in-memory cache for fetch results.
 *
 * The cache is implemented with a `Map` held in a `useRef` so that:
 * - It persists across re-renders without causing re-renders itself.
 * - It is automatically reset when the component unmounts (ref is garbage-collected).
 *
 * The cache evicts the oldest entry when 10 distinct keys have been stored to
 * prevent unbounded memory growth.
 *
 * @template T - The type of values being cached.
 * @returns An object with `get`, `set`, `has`, and `clear` operations.
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const cache = useFetchCache<UserData>();
 *
 *   useEffect(() => {
 *     const cached = cache.get(userId);
 *     if (cached) { setData(cached); return; }
 *     fetch(`/api/users/${userId}`).then(r => r.json()).then(d => {
 *       cache.set(userId, d);
 *       setData(d);
 *     });
 *   }, [userId]);
 * }
 * ```
 */
export function useFetchCache<T>(): FetchCacheOperations<T> {
  const cacheRef = useRef(new Map<string, T>());

  const get = (key: string): T | undefined => {
    return cacheRef.current.get(key);
  };

  const set = (key: string, value: T): void => {
    if (!cacheRef.current.has(key) && cacheRef.current.size >= 10) {
      const oldestKey = cacheRef.current.keys().next().value;

      if (oldestKey === undefined) return; // can't evict, bail out
      cacheRef.current.delete(oldestKey);
    }

    cacheRef.current.set(key, value);
  };

  const has = (key: string): boolean => {
    return cacheRef.current.has(key);
  };

  const clear = (): void => {
    cacheRef.current.clear();
  };

  return {
    get,
    set,
    has,
    clear,
  };
}

export default useFetchCache;
