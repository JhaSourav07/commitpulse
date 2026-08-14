// lib/svg/techStackAnalytics.ts
// Pure utility for aggregating tech stack data from repository contributions.
// This module has NO server-side imports and is safe to use in both client and server contexts.

import type { RepoContribution } from '../../types';
import { LANGUAGE_COLORS } from './languageColors';

export interface TechStackEntry {
  /** Programming language name */
  language: string;
  /** Total commit contributions to repos using this language */
  commits: number;
  /** Percentage of total contributions (0–100) */
  percentage: number;
  /** Hex color for this language (includes '#' prefix) */
  color: string;
}

export interface TechStackSummary {
  /** Top-5 languages by contribution count */
  topLanguages: TechStackEntry[];
  /** Full list of all detected languages */
  allLanguages: TechStackEntry[];
  /** Single dominant language name, or null if no data */
  dominantLanguage: string | null;
  /** Developer archetype string derived from the tech stack */
  archetype: string;
  /** Total contribution count across all repos */
  totalCommits: number;
}

// ─── Archetype definitions ────────────────────────────────────────────────────

const ARCHETYPES: Array<{
  name: string;
  languages: string[];
  minShare: number; // minimum % of one matching language to qualify
}> = [
  {
    name: 'AI / ML Engineer',
    languages: ['Python', 'Julia', 'R', 'MATLAB', 'Jupyter', 'Fortran'],
    minShare: 30,
  },
  {
    name: 'Systems Programmer',
    languages: ['Rust', 'C', 'C++', 'Zig', 'Go', 'Assembly'],
    minShare: 30,
  },
  {
    name: 'Mobile Developer',
    languages: ['Swift', 'Kotlin', 'Dart', 'Objective-C', 'Objective-C++', 'Java'],
    minShare: 30,
  },
  {
    name: 'Backend Developer',
    languages: ['Go', 'Java', 'Kotlin', 'Rust', 'Python', 'Ruby', 'PHP', 'Scala', 'Elixir', 'C#'],
    minShare: 40,
  },
  {
    name: 'Frontend Developer',
    languages: ['TypeScript', 'JavaScript', 'HTML', 'CSS', 'Vue', 'Svelte', 'Astro'],
    minShare: 40,
  },
  {
    name: 'Full-Stack Developer',
    languages: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Ruby', 'PHP', 'Java', 'Kotlin', 'C#'],
    minShare: 15,
  },
  {
    name: 'Data Engineer',
    languages: ['Python', 'Scala', 'SQL', 'R', 'Julia', 'MATLAB'],
    minShare: 30,
  },
  {
    name: 'DevOps Engineer',
    languages: ['Shell', 'Bash', 'Python', 'Go', 'HCL', 'Dockerfile', 'PowerShell', 'Makefile'],
    minShare: 25,
  },
  {
    name: 'Functional Programmer',
    languages: ['Haskell', 'Elixir', 'Clojure', 'F#', 'Ocaml', 'Erlang', 'Scheme', 'Common Lisp'],
    minShare: 20,
  },
];

// ─── Core aggregation ─────────────────────────────────────────────────────────

/**
 * Aggregate repository contributions into a sorted tech stack summary.
 *
 * @param repoContributions - Raw repository contribution data from the GitHub API
 * @returns Full TechStackSummary with percentages, colors, and archetype
 */
export function aggregateTechStack(repoContributions: RepoContribution[]): TechStackSummary {
  const langCounts: Record<string, number> = {};

  for (const contrib of repoContributions) {
    const lang = contrib.repository.primaryLanguage?.name;
    if (lang && lang.trim()) {
      langCounts[lang] = (langCounts[lang] ?? 0) + contrib.contributions.totalCount;
    }
  }

  const totalCommits = Object.values(langCounts).reduce((sum, n) => sum + n, 0);

  if (totalCommits === 0) {
    return {
      topLanguages: [],
      allLanguages: [],
      dominantLanguage: null,
      archetype: 'GitHub Developer',
      totalCommits: 0,
    };
  }

  const allLanguages: TechStackEntry[] = Object.entries(langCounts)
    .map(([language, commits]) => ({
      language,
      commits,
      percentage: Math.round((commits / totalCommits) * 100),
      color: (LANGUAGE_COLORS as Record<string, string>)[language] ?? '#8B949E',
    }))
    .sort((a, b) => b.commits - a.commits);

  const topLanguages = allLanguages.slice(0, 5);
  const dominantLanguage = topLanguages[0]?.language ?? null;
  const archetype = detectDeveloperArchetype(allLanguages);

  return {
    topLanguages,
    allLanguages,
    dominantLanguage,
    archetype,
    totalCommits,
  };
}

/**
 * Determine a developer archetype label based on the language distribution.
 * Scans archetype definitions in priority order and returns the first match.
 * Falls back to 'Polyglot Developer' if nothing matches, or 'GitHub Developer'
 * when there is no language data at all.
 *
 * @param allLanguages - Sorted (desc) list of TechStackEntry objects
 */
export function detectDeveloperArchetype(allLanguages: TechStackEntry[]): string {
  if (allLanguages.length === 0) return 'GitHub Developer';

  for (const archetype of ARCHETYPES) {
    const matchingLangs = allLanguages.filter((l) => archetype.languages.includes(l.language));
    const matchingShare = matchingLangs.reduce((sum, l) => sum + l.percentage, 0);

    // At least one language from this archetype must meet the threshold
    const topMatchShare = matchingLangs[0]?.percentage ?? 0;
    if (topMatchShare >= archetype.minShare || matchingShare >= archetype.minShare * 1.5) {
      return archetype.name;
    }
  }

  // Fallback: Full-Stack if multiple language families represented
  const hasWeb = allLanguages.some((l) =>
    ['TypeScript', 'JavaScript', 'HTML', 'CSS'].includes(l.language)
  );
  const hasBackend = allLanguages.some((l) =>
    ['Python', 'Go', 'Java', 'Ruby', 'PHP', 'Rust', 'C#', 'Kotlin'].includes(l.language)
  );
  if (hasWeb && hasBackend) return 'Full-Stack Developer';

  return 'Polyglot Developer';
}

/**
 * Get the dominant language color for a tech stack.
 * Returns the hex color (with '#' prefix) for the most-used language,
 * or the fallback if no language data is present.
 *
 * @param summary - Aggregated tech stack summary
 * @param fallbackColor - Hex color string (with '#' prefix) used when no language found
 */
export function getDominantLanguageColor(
  summary: TechStackSummary,
  fallbackColor: string = '#00ffaa'
): string {
  return summary.topLanguages[0]?.color ?? fallbackColor;
}

/**
 * Build a color palette of the top N languages for use in multi-accent tower rendering.
 * Returns an array of hex color strings (with '#' prefix).
 *
 * @param summary - Aggregated tech stack summary
 * @param count - Maximum number of colors to return (default 5)
 * @param fallbackColor - Accent fallback when fewer languages exist
 */
export function buildLanguageColorPalette(
  summary: TechStackSummary,
  count: number = 5,
  fallbackColor: string = '#00ffaa'
): string[] {
  if (summary.topLanguages.length === 0) return [fallbackColor];
  return summary.topLanguages.slice(0, count).map((l) => l.color);
}
