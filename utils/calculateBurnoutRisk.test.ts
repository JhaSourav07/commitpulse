import { describe, expect, it } from 'vitest';
import {
  calculateBurnoutRisk,
  measureCommitDecline,
  measureConcentration,
  measureIssueDelays,
  measurePRBacklog,
  measureInactivity,
  type BurnoutRiskInput,
} from './calculateBurnoutRisk';

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<BurnoutRiskInput> = {}): BurnoutRiskInput {
  return {
    sustainabilityScore: 80,
    busFactor: 4,
    dependencyRisk: 'Low',
    contributors: [
      { commitShare: 25, recentTrend: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5] },
      { commitShare: 25, recentTrend: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4] },
      { commitShare: 25, recentTrend: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3] },
      { commitShare: 25, recentTrend: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
    ],
    inactivityAlerts: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Unit tests — dimension calculators
// ---------------------------------------------------------------------------

describe('measureCommitDecline', () => {
  it('returns 0 when contributors have stable commit trends', () => {
    const contributors = [{ commitShare: 50, recentTrend: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5] }];
    expect(measureCommitDecline(contributors)).toBe(0);
  });

  it('returns a high score when commits drop to zero in the last 3 weeks', () => {
    const contributors = [
      { commitShare: 50, recentTrend: [10, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0, 0] },
    ];
    const decline = measureCommitDecline(contributors);
    expect(decline).toBe(100);
  });

  it('returns a moderate score when commits are halved', () => {
    const contributors = [
      { commitShare: 50, recentTrend: [10, 10, 10, 10, 10, 10, 10, 10, 10, 5, 5, 5] },
    ];
    const decline = measureCommitDecline(contributors);
    expect(decline).toBeGreaterThan(40);
    expect(decline).toBeLessThan(60);
  });

  it('returns 0 for empty contributors array', () => {
    expect(measureCommitDecline([])).toBe(0);
  });

  it('skips contributors with fewer than 6 weeks of trend data', () => {
    const contributors = [{ commitShare: 50, recentTrend: [1, 2, 3] }];
    expect(measureCommitDecline(contributors)).toBe(0);
  });
});

describe('measureConcentration', () => {
  it('returns the top contributor commitShare', () => {
    const contributors = [
      { commitShare: 70, recentTrend: [] },
      { commitShare: 30, recentTrend: [] },
    ];
    expect(measureConcentration(contributors)).toBe(70);
  });

  it('returns 0 for empty contributors', () => {
    expect(measureConcentration([])).toBe(0);
  });

  it('caps at 100', () => {
    const contributors = [{ commitShare: 120, recentTrend: [] }];
    expect(measureConcentration(contributors)).toBe(100);
  });
});

describe('measureIssueDelays', () => {
  it('returns 0 for perfect sustainability score', () => {
    expect(measureIssueDelays(100)).toBe(0);
  });

  it('returns 100 for zero sustainability score', () => {
    expect(measureIssueDelays(0)).toBe(100);
  });

  it('returns an inverse of the sustainability score', () => {
    expect(measureIssueDelays(60)).toBe(40);
  });
});

describe('measurePRBacklog', () => {
  it('returns 85 for High dependency risk', () => {
    expect(measurePRBacklog('High')).toBe(85);
  });

  it('returns 45 for Medium dependency risk', () => {
    expect(measurePRBacklog('Medium')).toBe(45);
  });

  it('returns 10 for Low dependency risk', () => {
    expect(measurePRBacklog('Low')).toBe(10);
  });
});

describe('measureInactivity', () => {
  it('returns 0 when there are no alerts', () => {
    expect(measureInactivity([])).toBe(0);
  });

  it('applies higher penalty for High severity alerts', () => {
    const highResult = measureInactivity([{ weeksSilent: 3, severity: 'High' }]);
    const mediumResult = measureInactivity([{ weeksSilent: 3, severity: 'Medium' }]);
    expect(highResult).toBeGreaterThan(mediumResult);
  });

  it('increases penalty with longer silence periods', () => {
    const short = measureInactivity([{ weeksSilent: 1, severity: 'Medium' }]);
    const long = measureInactivity([{ weeksSilent: 6, severity: 'Medium' }]);
    expect(long).toBeGreaterThan(short);
  });

  it('caps at 100', () => {
    const alerts = Array.from({ length: 10 }, () => ({
      weeksSilent: 10,
      severity: 'High' as const,
    }));
    expect(measureInactivity(alerts)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Unit tests — main calculator
// ---------------------------------------------------------------------------

describe('calculateBurnoutRisk', () => {
  it('returns Low risk for a healthy repository', () => {
    const result = calculateBurnoutRisk(makeInput());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(30);
    expect(result.level).toBe('Low');
    expect(result.description).toContain('Low Risk');
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it('returns High risk for a single-contributor repo with decline and alerts', () => {
    const result = calculateBurnoutRisk(
      makeInput({
        sustainabilityScore: 20,
        busFactor: 1,
        dependencyRisk: 'High',
        contributors: [
          { commitShare: 95, recentTrend: [20, 20, 20, 20, 20, 20, 20, 20, 20, 0, 0, 0] },
        ],
        inactivityAlerts: [
          { weeksSilent: 6, severity: 'High' },
          { weeksSilent: 4, severity: 'Medium' },
        ],
      })
    );
    expect(result.score).toBeGreaterThan(70);
    expect(result.level).toBe('High');
    expect(result.description).toContain('High Risk');
  });

  it('returns Moderate risk for a moderately concentrated repo', () => {
    const result = calculateBurnoutRisk(
      makeInput({
        sustainabilityScore: 55,
        busFactor: 2,
        dependencyRisk: 'Medium',
        contributors: [
          { commitShare: 55, recentTrend: [8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6] },
          { commitShare: 45, recentTrend: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5] },
        ],
        inactivityAlerts: [{ weeksSilent: 3, severity: 'Medium' }],
      })
    );
    expect(result.score).toBeGreaterThan(30);
    expect(result.score).toBeLessThanOrEqual(70);
    expect(result.level).toBe('Moderate');
  });

  it('score is always clamped between 0 and 100', () => {
    // Very healthy repo
    const low = calculateBurnoutRisk(
      makeInput({
        sustainabilityScore: 100,
        busFactor: 10,
        dependencyRisk: 'Low',
        contributors: Array.from({ length: 10 }, () => ({
          commitShare: 10,
          recentTrend: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        })),
        inactivityAlerts: [],
      })
    );
    expect(low.score).toBeGreaterThanOrEqual(0);
    expect(low.score).toBeLessThanOrEqual(100);

    // Very unhealthy repo
    const high = calculateBurnoutRisk(
      makeInput({
        sustainabilityScore: 0,
        busFactor: 1,
        dependencyRisk: 'High',
        contributors: [
          { commitShare: 100, recentTrend: [50, 50, 50, 50, 50, 50, 50, 50, 50, 0, 0, 0] },
        ],
        inactivityAlerts: Array.from({ length: 5 }, () => ({
          weeksSilent: 8,
          severity: 'High' as const,
        })),
      })
    );
    expect(high.score).toBeGreaterThanOrEqual(0);
    expect(high.score).toBeLessThanOrEqual(100);
  });

  it('handles empty contributors array gracefully', () => {
    const result = calculateBurnoutRisk(makeInput({ contributors: [], inactivityAlerts: [] }));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Unit tests — recommendation generation
// ---------------------------------------------------------------------------

describe('recommendation generation', () => {
  it('generates "Distribute Responsibilities" when top share is above 50%', () => {
    const result = calculateBurnoutRisk(
      makeInput({
        contributors: [
          { commitShare: 80, recentTrend: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5] },
          { commitShare: 20, recentTrend: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
        ],
      })
    );
    expect(result.recommendations.some((r) => r.title === 'Distribute Responsibilities')).toBe(
      true
    );
  });

  it('generates "Add Maintainers" when bus factor is 1 or dependency risk is High', () => {
    const result = calculateBurnoutRisk(makeInput({ busFactor: 1, dependencyRisk: 'High' }));
    expect(result.recommendations.some((r) => r.title === 'Add Maintainers')).toBe(true);
  });

  it('generates "Increase Community Engagement" when inactivity is high', () => {
    const result = calculateBurnoutRisk(
      makeInput({
        inactivityAlerts: [
          { weeksSilent: 5, severity: 'High' },
          { weeksSilent: 4, severity: 'Medium' },
        ],
      })
    );
    expect(result.recommendations.some((r) => r.title === 'Increase Community Engagement')).toBe(
      true
    );
  });

  it('generates fallback "Maintain Healthy Practices" for a perfectly healthy repo', () => {
    const result = calculateBurnoutRisk(
      makeInput({
        sustainabilityScore: 100,
        busFactor: 8,
        dependencyRisk: 'Low',
        contributors: Array.from({ length: 8 }, () => ({
          commitShare: 12.5,
          recentTrend: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        })),
        inactivityAlerts: [],
      })
    );
    expect(result.recommendations.some((r) => r.title === 'Maintain Healthy Practices')).toBe(true);
  });
});
