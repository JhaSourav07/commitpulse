'use client';
import { useEffect, useState } from 'react';

/**
 * Reads from localStorage synchronously with an SSR guard.
 * Used as a lazy useState initializer so the stored value is available
 * on the first render — consistent with useRecentSearches.ts.
 * Returns initialValue when running on the server or when the key is absent.
 */
function readFromStorage<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') return initialValue;
  try {
    const item = window.localStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : initialValue;
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): readonly [T, (value: T) => void] {
  // Lazy initializer reads from localStorage synchronously on first render
  // instead of deferring to a useEffect — eliminates the stale initialValue
  // flash on mount and prevents setValue from overwriting stored data before
  // the deferred read had a chance to run.
  const [storedValue, setStoredValue] = useState<T>(() => readFromStorage(key, initialValue));

  // Re-sync when the key changes (e.g. component reused with a different key).
  // setState inside an effect is intentional here — we are synchronising React
  // state with an external system (localStorage) when the key prop changes,
  // which is exactly the use-case effects are designed for per React docs.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStoredValue(readFromStorage(key, initialValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = (value: T): void => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors (private browsing, quota exceeded, etc.)
      setStoredValue(value);
    }
  };

  return [storedValue, setValue] as const;
}

export default useLocalStorage;
