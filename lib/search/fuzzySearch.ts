import type { SearchableDomain } from './domains';

export interface SearchResult {
  domain: SearchableDomain;
  /** Higher is a better match */
  score: number;
}

/**
 * Levenshtein edit distance, capped early once it exceeds `maxDistance`
 * (returns maxDistance + 1 in that case) to keep this cheap for short UI
 * strings — there are only a handful of domains to score per keystroke.
 */
function levenshtein(a: string, b: string, maxDistance: number): number {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  const dp: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    let prevDiag = dp[0];
    dp[0] = i;
    let rowMin = dp[0];

    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1, // deletion
        dp[j - 1] + 1, // insertion
        prevDiag + cost // substitution
      );
      prevDiag = temp;
      rowMin = Math.min(rowMin, dp[j]);
    }

    // Early exit: whole row exceeds the budget, no way to recover
    if (rowMin > maxDistance) return maxDistance + 1;
  }

  return dp[b.length];
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Scores a single field (title / description / keyword) against the query.
 * Returns 0 if there's no meaningful match.
 */
function scoreField(query: string, field: string, weight: number): number {
  const f = normalize(field);
  if (!f) return 0;

  if (f === query) return weight * 3; // exact match
  if (f.startsWith(query)) return weight * 2.2; // prefix match
  if (f.includes(query)) return weight * 1.6; // substring match

  // Typo tolerance: only worth checking on short-ish query/word pairs,
  // otherwise edit distance gets noisy and slow.
  if (query.length >= 3) {
    const words = f.split(/\s+/);
    for (const word of words) {
      const maxDistance = query.length <= 4 ? 1 : 2;
      const dist = levenshtein(query, word, maxDistance);
      if (dist <= maxDistance) {
        // Closer matches score higher; weight scaled down vs substring hits
        return weight * (1.1 - dist * 0.3);
      }
    }
  }

  return 0;
}

/**
 * Search all domains for a query, returning ranked results.
 * Empty/whitespace-only queries return an empty array (caller should show
 * a default/empty state instead).
 */
export function searchDomains(domains: SearchableDomain[], rawQuery: string): SearchResult[] {
  const query = normalize(rawQuery);
  if (!query) return [];

  const results: SearchResult[] = [];

  for (const domain of domains) {
    let score = 0;
    score += scoreField(query, domain.title, 10);
    score += scoreField(query, domain.category, 4);
    score += scoreField(query, domain.description, 2);

    for (const keyword of domain.keywords) {
      score += scoreField(query, keyword, 5);
    }

    if (score > 0) {
      results.push({ domain, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
