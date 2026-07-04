import { describe, expect, it } from 'vitest';
import {
  analyzeTeamAttribution,
  busFactor,
  giniCoefficient,
  type AttributedCommit,
} from './authorAttribution';

const commit = (author: string, date: string, additions = 0, deletions = 0): AttributedCommit => ({
  author,
  date,
  additions,
  deletions,
});

describe('giniCoefficient', () => {
  it('is 0 for perfectly even contribution', () => {
    expect(giniCoefficient([10, 10, 10, 10])).toBeCloseTo(0);
  });

  it('approaches 1 when one author does everything', () => {
    expect(giniCoefficient([100, 0, 0, 0])).toBeCloseTo(0.75);
    expect(giniCoefficient([1000, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toBeCloseTo(0.9);
  });

  it('handles degenerate inputs', () => {
    expect(giniCoefficient([])).toBe(0);
    expect(giniCoefficient([5])).toBe(0);
    expect(giniCoefficient([0, 0, 0])).toBe(0);
  });
});

describe('busFactor', () => {
  it('is 1 when a single author covers half the commits', () => {
    expect(busFactor([60, 20, 20])).toBe(1);
  });

  it('grows as work is spread more evenly', () => {
    expect(busFactor([25, 25, 25, 25])).toBe(2);
    expect(busFactor([10, 10, 10, 10, 10])).toBe(3);
  });

  it('is 0 for no commits', () => {
    expect(busFactor([])).toBe(0);
    expect(busFactor([0, 0])).toBe(0);
  });
});

describe('analyzeTeamAttribution', () => {
  const commits: AttributedCommit[] = [
    commit('alice', '2026-06-01T10:00:00Z', 100, 20),
    commit('alice', '2026-06-01T15:00:00Z', 50, 5),
    commit('alice', '2026-06-03T09:00:00Z', 10, 1),
    commit('bob', '2026-06-02T11:00:00Z', 30, 10),
    commit('carol', '2026-06-04T12:00:00Z', 5, 0),
    commit('bob', '2026-06-05T16:00:00Z', 20, 2),
  ];

  it('attributes commits, lines and activity per author', () => {
    const result = analyzeTeamAttribution(commits);
    expect(result.totalCommits).toBe(6);
    expect(result.totalAuthors).toBe(3);

    const alice = result.authors.find((a) => a.author === 'alice')!;
    expect(alice.commits).toBe(3);
    expect(alice.share).toBeCloseTo(0.5);
    expect(alice.activeDays).toBe(2);
    expect(alice.additions).toBe(160);
    expect(alice.deletions).toBe(26);
    expect(alice.firstCommit).toBe('2026-06-01T10:00:00Z');
    expect(alice.lastCommit).toBe('2026-06-03T09:00:00Z');
  });

  it('orders authors by commit count with a stable name tiebreak', () => {
    const result = analyzeTeamAttribution(commits);
    expect(result.authors.map((a) => a.author)).toEqual(['alice', 'bob', 'carol']);
    expect(result.topContributors).toEqual(['alice', 'bob', 'carol']);
  });

  it('computes bus factor and concentration for the team', () => {
    const result = analyzeTeamAttribution(commits);
    expect(result.busFactor).toBe(1); // alice alone covers half
    expect(result.concentration).toBeGreaterThan(0);
    expect(result.concentration).toBeLessThan(1);
  });

  it('ignores commits with blank authors', () => {
    const result = analyzeTeamAttribution([
      commit('  ', '2026-06-01T00:00:00Z'),
      commit('dave', '2026-06-01T00:00:00Z'),
    ]);
    expect(result.totalAuthors).toBe(1);
    expect(result.totalCommits).toBe(1);
  });

  it('handles an empty commit list', () => {
    const result = analyzeTeamAttribution([]);
    expect(result.totalCommits).toBe(0);
    expect(result.totalAuthors).toBe(0);
    expect(result.busFactor).toBe(0);
    expect(result.concentration).toBe(0);
    expect(result.topContributors).toEqual([]);
  });

  it('treats missing line counts as zero', () => {
    const result = analyzeTeamAttribution([{ author: 'erin', date: '2026-06-01T00:00:00Z' }]);
    expect(result.authors[0].additions).toBe(0);
    expect(result.authors[0].deletions).toBe(0);
  });
});
