'use client';

import { useState, useEffect } from 'react';

export const STORAGE_KEY = 'recentSearches';
export const MAX_SEARCHES = 5;

type State = { searches: string[]; mounted: boolean };

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

/**
 * A hook to manage and persist a list of recent searches.
 *
 * It uses localStorage for persistence and ensures SSR compatibility by starting
 * with an empty state on the first render and updating upon hydration.
 *
 * @returns An object containing the recent searches, a function to add a search, and a function to clear all searches.
 */
export function useRecentSearches() {
  // Always start with [] and mounted:false on both server and client so the
  // initial render matches (SSR-safe). A single setState in the mount effect
  // reads from localStorage and flips mounted:true in one batch — this satisfies
  // the react-hooks/set-state-in-effect rule which flags multiple synchronous
  // setState calls inside an effect body.
  const [state, setState] = useState<State>({ searches: [], mounted: false });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ searches: loadFromStorage(), mounted: true });
  }, []);
  // Single setState call — reads external system (localStorage) and syncs
  // React state in one update, which is exactly what effects are for.
  useEffect(() => {
    if (!state.mounted) return;

    // Don't write anything for an empty list.
    if (state.searches.length === 0) return;

    writeStorage(state.searches);
  }, [state.searches, state.mounted]);

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
    writeStorage(null);
  };

  const removeSearch = (query: string): void => {
    setState((prev) => {
      const filtered = prev.searches.filter((s) => s !== query);
      return { ...prev, searches: filtered };
    });
  };

  // Return empty searches until after hydration to prevent SSR/client mismatch.
  return {
    searches: state.mounted ? state.searches : [],
    addSearch,
    clearSearches,
    removeSearch,
  };
}
