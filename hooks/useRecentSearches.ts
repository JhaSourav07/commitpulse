'use client';

import { useState } from 'react';

const KEY = 'recentSearches';
const MAX = 5;

function loadFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(KEY);
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
        localStorage.setItem(KEY, JSON.stringify(deduped));
      } catch {}
      return deduped;
    });
  };

  const clearSearches = () => {
    setSearches([]);
    try {
      localStorage.removeItem(KEY);
    } catch {}
  };

  return { searches, addSearch, clearSearches };
}
