'use client';

import { useState } from 'react';

export const STORAGE_STORAGE_KEY = 'recentSearches';
export const MAX = 5;

function loadFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>(loadFromStorage);

  const addSearch = (query: string) => {
    if (!query.trim()) return;
    setSearches((prev) => {
      const deduped = [query, ...prev.filter((s) => s !== query)].slice(0, MAX);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
      } catch {}
      return deduped;
    });
  };

  const clearSearches = () => {
    setSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return { searches, addSearch, clearSearches };
}
