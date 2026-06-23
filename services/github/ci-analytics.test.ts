import { describe, it, expect } from 'vitest';
import { processRuns } from './ci-analytics';
import type { CIWorkflowRun } from '@/types/ci-analytics';

function makeRun(overrides: Partial<CIWorkflowRun>): CIWorkflowRun {
  return {
    id: 1,
    name: 'CI',
    repository: 'owner/repo',
    branch: 'main',
    status: 'completed',
    conclusion: 'success',
    duration: 60,
    triggerEvent: 'push',
    startedAt: '2026-01-01T00:00:00Z',
    finishedAt: '2026-01-01T00:01:00Z',
    url: 'https://example.test',
    ...overrides,
  };
}

describe('processRuns', () => {
  it('returns a 0 success rate (never NaN) when no run has a success or failure conclusion', () => {
    const runs = [
      makeRun({ conclusion: 'cancelled' }),
      makeRun({ conclusion: null, status: 'in_progress' }),
      makeRun({ conclusion: 'skipped' }),
    ];

    const result = processRuns(runs);

    expect(result.totalRuns).toBe(3);
    expect(result.successRate).toBe(0);
    expect(Number.isNaN(result.successRate)).toBe(false);
  });

  it('computes the success rate over decided runs only (success + failure)', () => {
    const runs = [
      makeRun({ conclusion: 'success' }),
      makeRun({ conclusion: 'success' }),
      makeRun({ conclusion: 'success' }),
      makeRun({ conclusion: 'failure' }),
      makeRun({ conclusion: 'cancelled' }),
      makeRun({ conclusion: null, status: 'queued' }),
    ];

    // 3 success out of 4 decided runs = 75%; cancelled and queued runs are excluded.
    expect(processRuns(runs).successRate).toBe(75);
  });

  it('excludes zero-duration completed runs from the average build duration', () => {
    const runs = [
      makeRun({ conclusion: 'success', duration: 100 }),
      makeRun({ conclusion: 'failure', duration: 200 }),
      makeRun({ conclusion: 'cancelled', duration: 0 }),
    ];

    // Average over the two runs with a real duration: (100 + 200) / 2 = 150.
    expect(processRuns(runs).avgBuildDuration).toBe(150);
  });
});
