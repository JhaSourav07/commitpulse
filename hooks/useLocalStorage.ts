'use client';

/**
 * A React hook that syncs a piece of state with `localStorage`.
 *
 * This is a client-side only hook (marked with `'use client'`). It gracefully
 * handles server-side rendering (SSR) and cookie-based static rendering (SSG)
 * by returning the `initialValue` when `window` is unavailable.
 *
 * Error handling:
 * - `JSON.parse` failures fall back to `initialValue`.
 * - `localStorage.setItem` failures (e.g. quota exceeded) are caught and
 *   silently ignored so the in-memory state is still kept up-to-date.
 */

import { useEffect, useState } from 'react';

/**
 * Reads a value from `localStorage`, falling back to `initialValue` in any
 * error case (SSR, quota exceeded, corrupt JSON).
 *
 * @template T - The expected type of the stored value.
 * @param key   - The localStorage key to read.
 * @param initialValue - The value to return when the key is absent or an error occurs.
 * @returns The parsed value from storage, or `initialValue`.
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

/**
 * A React hook that keeps a piece of state synchronized with `localStorage`.
 *
 * The hook initializes from `localStorage` (or `initialValue` if unavailable).
 * Any subsequent call to the returned setter updates both the React state and
 * the `localStorage` entry.
 *
 * **SSR / SSG safety:** when rendered on the server, `initialValue` is always
 * returned because `window` is not available. The `localStorage` value is
 * re-read on the client after the initial mount via `useEffect`.
 *
 * @template T - The type of the stored value. Must be JSON-serializable.
 * @param key          - The `localStorage` key to use. Changing this key
 *   after the hook has mounted will re-read from storage.
 * @param initialValue - The default value used when the key is absent or
 *   during SSR / SSG rendering.
 * @returns A readonly tuple `[value, setValue]` where `value` is always current
 *   and `setValue` is the only way to update it.
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * function ThemeToggle() {
 *   const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
 *   return (
 *     <button onClick={() => setDarkMode(!darkMode)}>
 *       {darkMode ? 'Dark' : 'Light'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useLocalStorage<T>(key: string, initialValue: T): readonly [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

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
      // Quota exceeded or other localStorage error — keep in-memory state in sync
      setStoredValue(value);
    }
  };

  return [storedValue, setValue] as const;
}

export default useLocalStorage;
