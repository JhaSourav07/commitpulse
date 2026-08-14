// lib/svg/techStackAnalytics.test.ts
import { describe, it, expect } from 'vitest';
import {
  aggregateTechStack,
  detectDeveloperArchetype,
  getDominantLanguageColor,
  buildLanguageColorPalette,
  type TechStackEntry,
} from './techStackAnalytics';
import type { RepoContribution } from '../../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRepo(name: string, language: string | null, count: number): RepoContribution {
  return {
    repository: {
      name,
      primaryLanguage: language ? { name: language } : null,
    },
    contributions: { totalCount: count },
  };
}

// ── aggregateTechStack ────────────────────────────────────────────────────────

describe('aggregateTechStack', () => {
  it('returns empty summary for empty input', () => {
    const summary = aggregateTechStack([]);
    expect(summary.topLanguages).toEqual([]);
    expect(summary.allLanguages).toEqual([]);
    expect(summary.dominantLanguage).toBeNull();
    expect(summary.archetype).toBe('GitHub Developer');
    expect(summary.totalCommits).toBe(0);
  });

  it('returns empty summary when all repos have no language', () => {
    const repos = [makeRepo('repo1', null, 50), makeRepo('repo2', null, 30)];
    const summary = aggregateTechStack(repos);
    expect(summary.topLanguages).toEqual([]);
    expect(summary.dominantLanguage).toBeNull();
  });

  it('correctly aggregates single language', () => {
    const repos = [makeRepo('a', 'TypeScript', 100), makeRepo('b', 'TypeScript', 50)];
    const summary = aggregateTechStack(repos);
    expect(summary.topLanguages).toHaveLength(1);
    expect(summary.topLanguages[0]!.language).toBe('TypeScript');
    expect(summary.topLanguages[0]!.commits).toBe(150);
    expect(summary.topLanguages[0]!.percentage).toBe(100);
    expect(summary.dominantLanguage).toBe('TypeScript');
  });

  it('sorts languages by commit count descending', () => {
    const repos = [
      makeRepo('a', 'Go', 10),
      makeRepo('b', 'Python', 200),
      makeRepo('c', 'TypeScript', 100),
    ];
    const summary = aggregateTechStack(repos);
    expect(summary.topLanguages[0]!.language).toBe('Python');
    expect(summary.topLanguages[1]!.language).toBe('TypeScript');
    expect(summary.topLanguages[2]!.language).toBe('Go');
  });

  it('limits topLanguages to 5', () => {
    const repos = [
      makeRepo('a', 'TypeScript', 100),
      makeRepo('b', 'Python', 90),
      makeRepo('c', 'Go', 80),
      makeRepo('d', 'Rust', 70),
      makeRepo('e', 'Java', 60),
      makeRepo('f', 'Ruby', 50),
    ];
    const summary = aggregateTechStack(repos);
    expect(summary.topLanguages).toHaveLength(5);
    expect(summary.allLanguages).toHaveLength(6);
    // Ruby is #6, excluded from top 5 but in allLanguages
    expect(summary.allLanguages.at(-1)!.language).toBe('Ruby');
  });

  it('computes percentages correctly', () => {
    const repos = [makeRepo('a', 'TypeScript', 75), makeRepo('b', 'Python', 25)];
    const summary = aggregateTechStack(repos);
    const ts = summary.topLanguages.find((l) => l.language === 'TypeScript');
    const py = summary.topLanguages.find((l) => l.language === 'Python');
    expect(ts!.percentage).toBe(75);
    expect(py!.percentage).toBe(25);
  });

  it('assigns known LANGUAGE_COLORS', () => {
    const repos = [makeRepo('a', 'TypeScript', 100)];
    const summary = aggregateTechStack(repos);
    expect(summary.topLanguages[0]!.color).toBe('#3178c6');
  });

  it('assigns fallback color for unknown languages', () => {
    const repos = [makeRepo('a', 'BrainFuck', 100)];
    const summary = aggregateTechStack(repos);
    expect(summary.topLanguages[0]!.color).toBe('#8B949E');
  });

  it('computes totalCommits correctly', () => {
    const repos = [makeRepo('a', 'Go', 40), makeRepo('b', 'Rust', 60)];
    const summary = aggregateTechStack(repos);
    expect(summary.totalCommits).toBe(100);
  });
});

// ── detectDeveloperArchetype ──────────────────────────────────────────────────

describe('detectDeveloperArchetype', () => {
  it('returns GitHub Developer for empty input', () => {
    expect(detectDeveloperArchetype([])).toBe('GitHub Developer');
  });

  it('detects AI / ML Engineer', () => {
    const stack: TechStackEntry[] = [
      { language: 'Python', commits: 300, percentage: 75, color: '#3572A5' },
      { language: 'Julia', commits: 100, percentage: 25, color: '#a270ba' },
    ];
    expect(detectDeveloperArchetype(stack)).toBe('AI / ML Engineer');
  });

  it('detects Systems Programmer', () => {
    const stack: TechStackEntry[] = [
      { language: 'Rust', commits: 300, percentage: 70, color: '#dea584' },
      { language: 'C', commits: 100, percentage: 30, color: '#555555' },
    ];
    expect(detectDeveloperArchetype(stack)).toBe('Systems Programmer');
  });

  it('detects Frontend Developer', () => {
    const stack: TechStackEntry[] = [
      { language: 'TypeScript', commits: 400, percentage: 80, color: '#3178c6' },
      { language: 'CSS', commits: 100, percentage: 20, color: '#563d7c' },
    ];
    expect(detectDeveloperArchetype(stack)).toBe('Frontend Developer');
  });

  it('detects Mobile Developer', () => {
    const stack: TechStackEntry[] = [
      { language: 'Swift', commits: 300, percentage: 60, color: '#F05138' },
      { language: 'Kotlin', commits: 200, percentage: 40, color: '#A97BFF' },
    ];
    expect(detectDeveloperArchetype(stack)).toBe('Mobile Developer');
  });

  it('detects a plausible archetype for mixed web+backend stack', () => {
    const stack: TechStackEntry[] = [
      { language: 'TypeScript', commits: 200, percentage: 40, color: '#3178c6' },
      { language: 'Python', commits: 200, percentage: 40, color: '#3572A5' },
      { language: 'CSS', commits: 100, percentage: 20, color: '#563d7c' },
    ];
    const result = detectDeveloperArchetype(stack);
    // TypeScript (40%) qualifies for Frontend; Python (40%) qualifies for AI/ML.
    // All three are legitimate archetypes for this mixed profile.
    expect(['Frontend Developer', 'Full-Stack Developer', 'AI / ML Engineer']).toContain(result);
  });

  it('falls back to Polyglot Developer for unusual stacks', () => {
    const stack: TechStackEntry[] = [
      { language: 'Prolog', commits: 50, percentage: 25, color: '#74283c' },
      { language: 'COBOL', commits: 50, percentage: 25, color: '#0101ff' },
      { language: 'Fortran', commits: 50, percentage: 25, color: '#4d41b1' },
      { language: 'Awk', commits: 50, percentage: 25, color: '#c30e9b' },
    ];
    expect(detectDeveloperArchetype(stack)).toBe('Polyglot Developer');
  });
});

// ── getDominantLanguageColor ──────────────────────────────────────────────────

describe('getDominantLanguageColor', () => {
  it('returns fallback color for empty summary', () => {
    const summary = aggregateTechStack([]);
    expect(getDominantLanguageColor(summary, '#aabbcc')).toBe('#aabbcc');
  });

  it('returns dominant language color', () => {
    const repos = [makeRepo('a', 'TypeScript', 100), makeRepo('b', 'Go', 20)];
    const summary = aggregateTechStack(repos);
    expect(getDominantLanguageColor(summary)).toBe('#3178c6');
  });
});

// ── buildLanguageColorPalette ─────────────────────────────────────────────────

describe('buildLanguageColorPalette', () => {
  it('returns fallback for empty summary', () => {
    const summary = aggregateTechStack([]);
    expect(buildLanguageColorPalette(summary, 5, '#00ffaa')).toEqual(['#00ffaa']);
  });

  it('returns up to N colors', () => {
    const repos = [
      makeRepo('a', 'TypeScript', 100),
      makeRepo('b', 'Python', 90),
      makeRepo('c', 'Go', 80),
      makeRepo('d', 'Rust', 70),
      makeRepo('e', 'Java', 60),
      makeRepo('f', 'Ruby', 50),
    ];
    const summary = aggregateTechStack(repos);
    const palette = buildLanguageColorPalette(summary, 3);
    expect(palette).toHaveLength(3);
    expect(palette[0]).toBe('#3178c6'); // TypeScript
    expect(palette[1]).toBe('#3572A5'); // Python
    expect(palette[2]).toBe('#00ADD8'); // Go
  });
});
