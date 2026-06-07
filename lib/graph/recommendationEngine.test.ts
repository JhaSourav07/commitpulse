import { describe, it, expect } from 'vitest';
import { getRecommendations } from './recommendationEngine';
import { DEPENDENCY_GRAPH } from './dependencyGraph';

describe('Dependency Graph Recommendation Engine', () => {
  it('should return empty list when nothing is selected', () => {
    const recs = getRecommendations([]);
    expect(recs).toEqual([]);
  });

  it('should filter out already selected technologies (duplicate filtering)', () => {
    // React recommends nextjs, tailwindcss, typescript, shadcnui, framermotion, storybook
    // If we select react AND nextjs, then nextjs should NOT be recommended
    const recs = getRecommendations(['react', 'nextjs']);
    const recommendedIds = recs.map((r) => r.id);

    expect(recommendedIds).not.toContain('react');
    expect(recommendedIds).not.toContain('nextjs');
    expect(recommendedIds).toContain('tailwindcss');
    expect(recommendedIds).toContain('typescript');
  });

  it('should aggregate scores correctly for multiple selected technologies (score aggregation & multi-selection)', () => {
    // React recommends nextjs with score 0.8
    // Nodejs recommends nextjs with score 0.75
    // Aggregated score should be: 1 - (1 - 0.8) * (1 - 0.75) = 1 - 0.2 * 0.25 = 1 - 0.05 = 0.95 (95%)
    const recs = getRecommendations(['react', 'nodejs']);
    const nextjsRec = recs.find((r) => r.id === 'nextjs');

    expect(nextjsRec).toBeDefined();
    expect(nextjsRec!.score).toBe(95);
    expect(nextjsRec!.strength).toBe('strong');
  });

  it('should rank recommendations correctly by score descending', () => {
    const recs = getRecommendations(['react']);

    // Check that recommendations are sorted in descending order of score
    for (let i = 0; i < recs.length - 1; i++) {
      expect(recs[i].score).toBeGreaterThanOrEqual(recs[i + 1].score);
    }
  });

  it('should traverse graph node edges and retrieve category, strength, and reasons correctly', () => {
    const recs = getRecommendations(['react']);
    const tailwindRec = recs.find((r) => r.id === 'tailwindcss');

    expect(tailwindRec).toBeDefined();
    expect(tailwindRec!.category).toBe('Styling');
    expect(tailwindRec!.strength).toBe('strong');
    expect(tailwindRec!.reasons.length).toBeGreaterThan(0);
    expect(tailwindRec!.reasons).toContain(
      'Highly popular utility-first CSS library with React developers'
    );
  });

  it('should combine unique reasons from multiple sources', () => {
    const recs = getRecommendations(['react', 'nextjs']);
    const tailwindRec = recs.find((r) => r.id === 'tailwindcss');

    expect(tailwindRec).toBeDefined();
    // React -> tailwindcss has:
    // - 'Highly popular utility-first CSS library with React developers'
    // - 'Strong ecosystem integration with Tailwind classes'
    // Next.js -> tailwindcss has:
    // - 'Directly supported and pre-configured in Next.js templates'
    // - 'Highly recommended for styling Next.js applications'
    // They should be merged and deduplicated
    expect(tailwindRec!.reasons).toContain(
      'Highly popular utility-first CSS library with React developers'
    );
    expect(tailwindRec!.reasons).toContain(
      'Directly supported and pre-configured in Next.js templates'
    );
  });
});
