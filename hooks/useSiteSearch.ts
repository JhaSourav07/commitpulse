'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { SEARCH_DOMAINS, type SearchableDomain } from '@/lib/search/domains';
import { searchDomains, type SearchResult } from '@/lib/search/fuzzySearch';

const DEBOUNCE_MS = 120; // short — this is local/instant, not a network call

/**
 * Return value of the `useSiteSearch` hook.
 */
export interface UseSiteSearchReturn {
  /** The raw, undebounced query string as typed by the user. */
  query: string;
  /** Setter to update the raw query string. */
  setQuery: (value: string) => void;
  /** Matched search results from the fuzzy domain search. */
  results: SearchResult[];
  /** True briefly while the debounced query differs from the live query (mid-keystroke). */
  isSearching: boolean;
  /** True when the trimmed query is non-empty. */
  hasQuery: boolean;
  /** Clears both the live and debounced query. */
  clear: () => void;
}

/**
 * Provides instant, typo-tolerant search over all "domains" (feature pages)
 * in the app, for use in the navbar search box.
 *
 * Uses a 120 ms debounce on the input query to avoid excessive re-renders
 * while keeping the search feel near-instant. The underlying fuzzy search
 * (`searchDomains`) provides typo tolerance and partial matching.
 *
 * @param domains - Array of searchable domains to search over.
 *                  Defaults to `SEARCH_DOMAINS` if omitted.
 * @returns A `UseSiteSearchReturn` object with query state and results.
 * @see {@link searchDomains} for the underlying fuzzy search implementation.
 */
export function useSiteSearch(domains: SearchableDomain[] = SEARCH_DOMAINS): UseSiteSearchReturn {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  const results = useMemo(() => searchDomains(domains, debouncedQuery), [domains, debouncedQuery]);

  return {
    query,
    setQuery,
    results,
    isSearching: query !== debouncedQuery && query.trim().length > 0,
    hasQuery: query.trim().length > 0,
    clear: () => setQuery(''),
  };
}
