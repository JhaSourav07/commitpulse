import { useRef } from 'react';

export function useFetchCache<T>() {
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
