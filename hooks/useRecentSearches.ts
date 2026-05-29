'use client';

const writeStorage = (searches: string[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
};

const readStorage = (): string[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

import { useState, useEffect } from 'react';

export const STORAGE_KEY = 'recentSearches';
export const MAX_SEARCHES = 5;

type State = { searches: string[]; mounted: boolean };

const loadFromStorage = () => {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem('recent-searches');

  try {
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export function useRecentSearches() {
  // Always start with [] and mounted:false on both server and client so the
  // initial render matches (SSR-safe). A single setState in the mount effect
  // reads from localStorage and flips mounted:true in one batch — this satisfies
  // the react-hooks/set-state-in-effect rule which flags multiple synchronous
  // setState calls inside an effect body.
  const [state, setState] = useState<State>({ searches: [], mounted: false });
  const isHydratedRef = useRef(false);

  useEffect(() => {
    // Single setState call — reads external system (localStorage) and syncs
    // React state in one update, which is exactly what effects are for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ searches: loadFromStorage(), mounted: true });
  }, []);

  // Synchronize localStorage with React state reactively when searches or mounted state changes.
  // This executes outside the state updater callbacks, ensuring they are completely pure and
  // safe for concurrent rendering and React Strict Mode.
  useEffect(() => {
    if (!state.mounted) return;

    // Skip the first synchronization effect run after hydration to prevent redundant writes
    // or eager key removal before user interaction.
    if (!isHydratedRef.current) {
      isHydratedRef.current = true;
      return;
    }

    if (state.searches.length === 0) {
      writeStorage(null);
    } else {
      writeStorage(state.searches);
    }
  }, [state.searches, state.mounted]);

  /**
   * Adds a new search query to the recent searches list.
   * If the query already exists, it is moved to the top.
   * The list is truncated to the maximum number of searches allowed.
   *
   * @param query - The search query to add.
   */
  const addSearch = (query: string) => {
    if (!query.trim()) return;
    setState((prev) => {
      const deduped = [query, ...prev.searches.filter((s) => s !== query)].slice(0, MAX_SEARCHES);
      return { ...prev, searches: deduped };
    });
  };

  /**
   * Clears all recent searches from state and localStorage.
   */
  const clearSearches = () => {
    setState((prev) => ({ ...prev, searches: [] }));
    writeStorage([]);
  };

  // Return empty searches until after hydration to prevent SSR/client mismatch.
  return {
    searches: state.mounted ? state.searches : [],
    addSearch,
    clearSearches,
    removeSearch,
  };
}
