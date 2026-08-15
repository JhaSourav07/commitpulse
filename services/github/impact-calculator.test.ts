import { describe, expect, it } from 'vitest';
import { calculateRealWorldImpact } from './impact-calculator';

describe('impact-calculator service', () => {
  it('handles empty repositories array safely with fallback defaults', () => {
    const metrics = calculateRealWorldImpact([]);
    expect(metrics.impactScore).toBe(0);
    expect(metrics.tier).toBe('Contributor');
    expect(metrics.hoursSaved).toBe(0);
    expect(metrics.developerValueDollars).toBe(0);
    expect(metrics.recruiterSummary.oneLiner).toContain('No repository activity');
  });

  it('calculates metrics, impact score and tier accurately for single repository', () => {
    const repos = [
      {
        name: 'test-app',
        commits: 50,
        stars: 10,
        forks: 5,
        pullRequestCount: 8,
        primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      },
    ];

    const metrics = calculateRealWorldImpact(repos);
    expect(metrics.impactScore).toBeGreaterThan(0);
    expect(metrics.hoursSaved).toBeGreaterThan(0);
    expect(metrics.developerValueDollars).toBeGreaterThan(0);
    expect(metrics.topLanguages[0].name).toBe('TypeScript');
    expect(metrics.recruiterSummary.bulletPoints.length).toBe(3);
  });

  it('correctly aggregates multiple repositories and determines tier levels', () => {
    const repos = [
      {
        name: 'core-backend',
        commits: 150,
        stars: 100,
        forks: 40,
        pullRequestCount: 25,
        primaryLanguage: { name: 'Go', color: '#00ADD8' },
      },
      {
        name: 'web-ui',
        commits: 100,
        stars: 50,
        forks: 15,
        pullRequestCount: 15,
        primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      },
    ];

    const metrics = calculateRealWorldImpact(repos);
    expect(metrics.impactScore).toBeGreaterThanOrEqual(70);
    expect(['Architect', 'Lead Innovator']).toContain(metrics.tier);
    expect(metrics.featureVsRefactorRatio.features).toBeGreaterThan(0);
    expect(metrics.topLanguages.length).toBe(2);
  });
});
