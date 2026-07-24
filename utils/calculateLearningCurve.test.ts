import { describe, it, expect } from 'vitest';
import { calculateLearningCurve, RawCommitActivity } from './calculateLearningCurve';

describe('calculateLearningCurve Utility', () => {
  it('correctly aggregates commits into academic domains', () => {
    const mockActivities: RawCommitActivity[] = [
      // Day 1: AI Focus
      { date: '2026-04-10', language: 'Python', linesAdded: 100, linesDeleted: 10 },
      { date: '2026-04-10', language: 'Jupyter Notebook', linesAdded: 50, linesDeleted: 0 },
      // Day 2: Web Dev Focus
      { date: '2026-04-11', language: 'TypeScript', linesAdded: 200, linesDeleted: 20 },
    ];

    const result = calculateLearningCurve(mockActivities);

    // Should detect 2 distinct study days
    expect(result.totalStudyDays).toBe(2);

    // AI has 2 commits vs Web Dev's 1 commit, so AI is primary
    expect(result.primaryDomain).toBe('Applied AI & Data Mining');

    // Timeline arrays check
    expect(result.timeline).toHaveLength(2);
    expect(result.timeline[0].domains['Applied AI & Data Mining']?.commitCount).toBe(2);
    expect(result.timeline[1].domains['Full-Stack Web Development']?.commitCount).toBe(1);
  });

  it('gracefully ignores uncategorized or general purpose languages', () => {
    const mockActivities: RawCommitActivity[] = [
      { date: '2026-04-12', language: 'Markdown', linesAdded: 10, linesDeleted: 2 },
      { date: '2026-04-12', language: 'Text', linesAdded: 5, linesDeleted: 1 },
    ];

    const result = calculateLearningCurve(mockActivities);

    // Should not count as study days if no academic syllabus languages are present
    expect(result.totalStudyDays).toBe(0);
    expect(result.timeline).toHaveLength(0);
  });
});
