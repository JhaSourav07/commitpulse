import { describe, it, expect, expectTypeOf } from 'vitest';
import { useRecentSearches, STORAGE_KEY, MAX_SEARCHES } from './useRecentSearches';

// Infer the hook's public API directly from its implementation.
type UseRecentSearchesReturn = ReturnType<typeof useRecentSearches>;

describe('useRecentSearches — TypeScript compiler validation & schema constraints', () => {
  it('1. exposes STORAGE_KEY and MAX_SEARCHES with correct primitive types', () => {
    expectTypeOf(STORAGE_KEY).toBeString();
    expectTypeOf(MAX_SEARCHES).toBeNumber();

    expect(typeof STORAGE_KEY).toBe('string');
    expect(typeof MAX_SEARCHES).toBe('number');
  });

  it('2. useRecentSearches accepts no arguments', () => {
    expectTypeOf(useRecentSearches).parameters.toEqualTypeOf<[]>();

    expect(useRecentSearches.length).toBe(0);
  });

  it('3. returns the expected public API shape', () => {
    expectTypeOf<UseRecentSearchesReturn>().toEqualTypeOf<{
      searches: string[];
      addSearch: (query: string) => void;
      clearSearches: () => void;
      removeSearch: (query: string) => void;
    }>();

    expectTypeOf<UseRecentSearchesReturn['searches']>().toEqualTypeOf<string[]>();
  });

  it('4. enforces function parameter and return types', () => {
    expectTypeOf<UseRecentSearchesReturn['addSearch']>().parameters.toEqualTypeOf<[string]>();
    expectTypeOf<UseRecentSearchesReturn['addSearch']>().returns.toBeVoid();

    expectTypeOf<UseRecentSearchesReturn['removeSearch']>().parameters.toEqualTypeOf<[string]>();
    expectTypeOf<UseRecentSearchesReturn['removeSearch']>().returns.toBeVoid();

    expectTypeOf<UseRecentSearchesReturn['clearSearches']>().parameters.toEqualTypeOf<[]>();
    expectTypeOf<UseRecentSearchesReturn['clearSearches']>().returns.toBeVoid();
  });

  it('5. verifies required fields and inferred property types', () => {
    expectTypeOf<UseRecentSearchesReturn>().toHaveProperty('searches');
    expectTypeOf<UseRecentSearchesReturn>().toHaveProperty('addSearch');
    expectTypeOf<UseRecentSearchesReturn>().toHaveProperty('removeSearch');
    expectTypeOf<UseRecentSearchesReturn>().toHaveProperty('clearSearches');

    expectTypeOf<UseRecentSearchesReturn['searches']>().items.toEqualTypeOf<string>();

    expect(STORAGE_KEY.length).toBeGreaterThan(0);
    expect(MAX_SEARCHES).toBeGreaterThan(0);
  });
});
