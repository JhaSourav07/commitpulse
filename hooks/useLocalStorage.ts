'use client';
import { useEffect, useState } from 'react';

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
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStoredValue(readFromStorage(key, initialValue));

    const handleStorageChange = (event: StorageEvent): void => {
      if (event.key !== key) return;
      setStoredValue(readFromStorage(key, initialValue));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = (value: T): void => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      setStoredValue(value);
    }
  };

  return [storedValue, setValue] as const;
}

export default useLocalStorage;
