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
 *
 * @param a - The first string to compare.
 * @param b - The second string to compare.
 * @param maxDistance - The maximum distance of interest. Returns `maxDistance + 1`
 *   immediately if the length difference between `a` and `b` exceeds this threshold,
 *   avoiding unnecessary DP computation.
 * @returns The edit distance between `a` and `b`, capped at `maxDistance + 1`.
 *   A return value of `maxDistance + 1` indicates the distance exceeds the budget.
 *
 * @see {@link https://en.wikipedia.org/wiki/Levenshtein_distance|Levenshtein distance}
 *   for the full algorithm definition.
 *
 * @remarks
 * This implementation uses the classic dynamic programming O(|a| * |b|) space
 * approach. The `maxDistance` cap enables early termination: when any row's
 * minimum value exceeds `maxDistance`, the function returns immediately since
 * no valid path can bring the final distance below the threshold.
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

/**
 * Normalises a search query or domain field for comparison.
 *
 * Trims leading/trailing whitespace and lowercases the string so that queries
 * are matched case-insensitively and accidental whitespace does not cause misses.
 *
 * @param s - The raw string to normalise.
 * @returns The trimmed, lowercased string.
 *
 * @see scoreField — this function is called before every field comparison.
 */
function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Scores a single domain field (title / description / keyword) against the query.
 *
 * Matching is performed on normalised strings (see `normalize`). The scoring
 * hierarchy from highest to lowest is:
 * 1. Exact match — `weight * 3.0`
 * 2. Prefix match — `weight * 2.2`
 * 3. Substring match — `weight * 1.6`
 * 4. Typo-tolerant match (Levenshtein distance 1-2) — `weight * (1.1 - dist * 0.3)`
 *
 * @param query - The normalised search query.
 * @param field - The domain field value to score against the query.
 * @param weight - A multiplier applied to the raw match score. Higher weights
 *   indicate more important fields (e.g. `title` has weight 10, `category` 4).
 * @returns A positive score if there is a match, `0` otherwise.
 *
 * @see levenshtein — used for typo tolerance when `query.length >= 3`.
 * @see searchDomains — calls `scoreField` for all fields of every domain.
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
 *
 * Scores each domain by summing the individual field scores from `scoreField`.
 * Results are returned in descending score order (best match first). Domains
 * with a zero total score are excluded from the results.
 *
 * @param domains - The list of searchable domain objects.
 * @param rawQuery - The raw (un-normalised) search query string. Whitespace-only
 *   or empty queries return an empty array.
 * @returns An array of `SearchResult` objects sorted by descending score.
 *   Returns `[]` for empty or whitespace-only queries.
 *
 * @see normalize — used to prepare query and field strings for comparison.
 * @see scoreField — applies weighted scoring across title, category, description,
 *   and keyword fields.
 * @see levenshtein — invoked within `scoreField` for typo-tolerant matching.
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
