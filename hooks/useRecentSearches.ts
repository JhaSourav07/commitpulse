'use client';

import { useState } from 'react';

export const STORAGE_KEY = 'recentSearches';
export const MAX_SEARCHES = 5;

type State = {
  searches: string[];
  mounted: boolean;
};

function loadFromStorage(): string[] {
  let saved: string[] = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) saved = JSON.parse(stored) as string[];
  } catch {
    // ignore malformed storage
  }
  return saved;
}

function writeStorage(searches: string[] | null): void {
  try {
    if (searches === null) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch {
    // ignore storage write failures
  }
}

export function useRecentSearches() {
  const [state, setState] = useState<State>(() => {
    if (typeof window === 'undefined') {
      return {
        searches: [],
        mounted: false,
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      return {
        searches: stored ? (JSON.parse(stored) as string[]) : [],
        mounted: true,
      };
    } catch {
      return {
        searches: [],
        mounted: true,
      };
    }
  });

  const addSearch = (query: string) => {
    if (!query.trim()) return;

    setState((prev) => {
      const deduped = [query, ...prev.searches.filter((s) => s !== query)].slice(0, MAX_SEARCHES);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
      } catch {
        // ignore storage write errors
      }

      return {
        ...prev,
        searches: deduped,
      };
    });
  };

  const clearSearches = () => {
    setState((prev) => ({
      ...prev,
      searches: [],
    }));

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage clear errors
    }
  };

  return {
    searches: state.mounted ? state.searches : [],
    addSearch,
    clearSearches,
  };
}
