'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'recent_searches';

export const useRecentSearches = () => {
  // Initialize state directly from localStorage to satisfy the linter
  const [searches, setSearches] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // fallback on parse error
        }
      }
    }
    return [];
  });

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const writeStorage = (newSearches: string[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSearches));
      } catch {
        // ignore storage write failures
      }
    }
  };

  const addSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearches((prev) => {
      const filtered = prev.filter((s) => s !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 10);
      writeStorage(updated);
      return updated;
    });
  };

  const removeSearch = (query: string) => {
    setSearches((prev) => {
      const filtered = prev.filter((s) => s !== query);
      writeStorage(filtered);
      return filtered;
    });
  };

  const clearSearches = () => {
    setSearches([]);
    writeStorage([]);
  };

  return {
    searches: isHydrated ? searches : [],
    addSearch,
    clearSearches,
    removeSearch,
  };
};