/**
 * Author attribution and team contribution analysis.
 *
 * The dashboard could show a team's combined activity but not who did
 * what: no per-author share, no concentration measure, no way to spot
 * that one person carries the project. This module turns a plain list
 * of attributed commits into per-author metrics and team level
 * indicators (bus factor, concentration index, top contributors).
 */

export interface AttributedCommit {
  /** Author login or resolved identity. */
  author: string;
  /** ISO timestamp of the commit. */
  date: string;
  additions?: number;
  deletions?: number;
}

export interface AuthorMetrics {
  author: string;
  commits: number;
  /** Share of total commits, 0 to 1. */
  share: number;
  /** Distinct UTC days with at least one commit. */
  activeDays: number;
  additions: number;
  deletions: number;
  firstCommit: string;
  lastCommit: string;
}

export interface TeamAttribution {
  totalCommits: number;
  totalAuthors: number;
  authors: AuthorMetrics[];
  /**
   * Smallest number of authors that together account for at least half
   * of all commits. A bus factor of 1 means the project stalls if a
   * single person leaves.
   */
  busFactor: number;
  /**
   * Gini coefficient of commit counts, 0 (perfectly even) to 1 (one
   * author does everything). Values above 0.6 indicate the workload is
   * concentrated on few people.
   */
  concentration: number;
  topContributors: string[];
  generatedAt: string;
}

function utcDay(iso: string): string {
  return iso.slice(0, 10);
}

/** Gini coefficient over a list of non-negative counts. */
export function giniCoefficient(counts: number[]): number {
  const values = counts.filter((c) => c >= 0).sort((a, b) => a - b);
  const n = values.length;
  const total = values.reduce((a, b) => a + b, 0);
  if (n < 2 || total === 0) return 0;

  let weightedSum = 0;
  for (let i = 0; i < n; i++) {
    weightedSum += (i + 1) * values[i];
  }
  return (2 * weightedSum) / (n * total) - (n + 1) / n;
}

/** Smallest set of authors covering at least half of all commits. */
export function busFactor(commitCounts: number[]): number {
  const sorted = [...commitCounts].sort((a, b) => b - a);
  const total = sorted.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;

  let covered = 0;
  for (let i = 0; i < sorted.length; i++) {
    covered += sorted[i];
    if (covered * 2 >= total) return i + 1;
  }
  return sorted.length;
}

export function analyzeTeamAttribution(commits: AttributedCommit[]): TeamAttribution {
  const byAuthor = new Map<
    string,
    { commits: number; days: Set<string>; additions: number; deletions: number; dates: string[] }
  >();

  for (const commit of commits) {
    const author = commit.author.trim();
    if (!author) continue;
    const entry = byAuthor.get(author) ?? {
      commits: 0,
      days: new Set<string>(),
      additions: 0,
      deletions: 0,
      dates: [],
    };
    entry.commits += 1;
    entry.days.add(utcDay(commit.date));
    entry.additions += commit.additions ?? 0;
    entry.deletions += commit.deletions ?? 0;
    entry.dates.push(commit.date);
    byAuthor.set(author, entry);
  }

  const totalCommits = Array.from(byAuthor.values()).reduce((sum, e) => sum + e.commits, 0);

  const authors: AuthorMetrics[] = Array.from(byAuthor.entries())
    .map(([author, entry]) => {
      const sortedDates = entry.dates.sort();
      return {
        author,
        commits: entry.commits,
        share: totalCommits > 0 ? entry.commits / totalCommits : 0,
        activeDays: entry.days.size,
        additions: entry.additions,
        deletions: entry.deletions,
        firstCommit: sortedDates[0],
        lastCommit: sortedDates[sortedDates.length - 1],
      };
    })
    .sort((a, b) => b.commits - a.commits || a.author.localeCompare(b.author));

  const counts = authors.map((a) => a.commits);

  return {
    totalCommits,
    totalAuthors: authors.length,
    authors,
    busFactor: busFactor(counts),
    concentration: Number(giniCoefficient(counts).toFixed(3)),
    topContributors: authors.slice(0, 3).map((a) => a.author),
    generatedAt: new Date().toISOString(),
  };
}
