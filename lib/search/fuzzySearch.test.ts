import { describe, it, expect } from 'vitest';
import { searchDomains } from './fuzzySearch';
import { SEARCH_DOMAINS } from './domains';

describe('searchDomains', () => {
  it('returns empty array for empty query', () => {
    expect(searchDomains(SEARCH_DOMAINS, '')).toEqual([]);
    expect(searchDomains(SEARCH_DOMAINS, '   ')).toEqual([]);
  });

  it('matches exact title', () => {
    const results = searchDomains(SEARCH_DOMAINS, 'Generator');
    expect(results[0].domain.id).toBe('generator');
  });

  it('matches case-insensitively', () => {
    const results = searchDomains(SEARCH_DOMAINS, 'COMPARE');
    expect(results[0].domain.id).toBe('compare');
  });

  it('matches by partial/substring', () => {
    const results = searchDomains(SEARCH_DOMAINS, 'burn');
    expect(results.some((r) => r.domain.id === 'burnout-analyzer')).toBe(true);
  });

  it('matches by keyword/synonym', () => {
    const results = searchDomains(SEARCH_DOMAINS, 'readme');
    expect(results[0].domain.id).toBe('generator');
  });

  it('matches by category', () => {
    const results = searchDomains(SEARCH_DOMAINS, 'tools');
    const ids = results.map((r) => r.domain.id);
    expect(ids).toContain('compare');
    expect(ids).toContain('burnout-analyzer');
    expect(ids).toContain('generator');
  });

  it('is typo-tolerant for short words (one-character substitution)', () => {
    // "comapre" -> "compare" (transposition, distance 2 for levenshtein subs but within budget)
    const results = searchDomains(SEARCH_DOMAINS, 'compre');
    expect(results.some((r) => r.domain.id === 'compare')).toBe(true);
  });

  it('is typo-tolerant for "generater" -> "generator"', () => {
    const results = searchDomains(SEARCH_DOMAINS, 'generater');
    expect(results.some((r) => r.domain.id === 'generator')).toBe(true);
  });

  it('ranks exact/prefix matches above substring matches', () => {
    const results = searchDomains(SEARCH_DOMAINS, 'customiz');
    // "Customization Studio" should outrank anything that merely contains a
    // partial keyword match
    expect(results[0].domain.id).toBe('customize');
  });

  it('returns no results for nonsense queries', () => {
    const results = searchDomains(SEARCH_DOMAINS, 'xyzzyplughqwerty');
    expect(results).toEqual([]);
  });

  it('does not throw on very short queries', () => {
    expect(() => searchDomains(SEARCH_DOMAINS, 'a')).not.toThrow();
    expect(() => searchDomains(SEARCH_DOMAINS, 'ab')).not.toThrow();
  });

  it('every domain entry has a non-empty href', () => {
    for (const domain of SEARCH_DOMAINS) {
      expect(domain.href.length).toBeGreaterThan(0);
    }
  });

  it('results are sorted by descending score', () => {
    const results = searchDomains(SEARCH_DOMAINS, 'doc');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });
});
