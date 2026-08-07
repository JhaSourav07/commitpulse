import { useRef } from 'react';

export function useFetchCache<T>() {
  const cacheRef = useRef(new Map<string, T>());

  const get = (key: string): T | undefined => {
    if (!cacheRef.current.has(key)) return undefined;
    const value = cacheRef.current.get(key)!;

    // Refresh recency on access: delete + re-insert so this key moves
    // to the end of the Map's iteration order. Without this, set()'s
    // "evict the first/oldest key" logic below makes this a strict
    // FIFO cache rather than an LRU one — a frequently re-accessed
    // entry would still get evicted purely based on when it was first
    // inserted, ignoring how often it's subsequently used.
    cacheRef.current.delete(key);
    cacheRef.current.set(key, value);

    return value;
  };

  const set = (key: string, value: T): void => {
    if (!cacheRef.current.has(key) && cacheRef.current.size >= 10) {
      // Because Map preserves insertion order, calling .next() gets
      // the very first item inserted (the least recently used).
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
