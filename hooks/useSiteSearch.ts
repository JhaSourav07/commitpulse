'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { SEARCH_DOMAINS, type SearchableDomain } from '@/lib/search/domains';
import { searchDomains, type SearchResult } from '@/lib/search/fuzzySearch';

const DEBOUNCE_MS = 120; // short — this is local/instant, not a network call

export interface UseSiteSearchReturn {
  query: string;
  setQuery: (value: string) => void;
  results: SearchResult[];
  /** True once the debounced query differs from the live query (briefly, mid-keystroke) */
  isSearching: boolean;
  hasQuery: boolean;
  clear: () => void;
}

/**
 * Provides instant, typo-tolerant search over all "domains" (feature pages)
 * in the app, for use in the navbar search box.
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
