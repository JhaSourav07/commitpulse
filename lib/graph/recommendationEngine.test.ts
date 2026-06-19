import { describe, it, expect } from 'vitest';
import { getRecommendations } from './recommendationEngine';

describe('Dependency Graph Recommendation Engine', () => {
  it('should return empty list when nothing is selected', () => {
    expect(getRecommendations([])).toEqual([]);
  });

  it('should filter out already selected technologies', () => {
    const recs = getRecommendations(['react', 'nextjs']);
    const recommendedIds = recs.map((r) => r.id);

    expect(recommendedIds).not.toContain('react');
    expect(recommendedIds).not.toContain('nextjs');
    expect(recommendedIds.length).toBeGreaterThan(0);
    expect(recommendedIds).toContain('tailwindcss');
    expect(recommendedIds).toContain('typescript');
  });

  it('should aggregate scores correctly for multiple selected technologies', () => {
    const recs = getRecommendations(['react', 'nodejs']);
    const nextjsRec = recs.find((r) => r.id === 'nextjs');

    expect(nextjsRec).toBeDefined();
    expect(nextjsRec!.strength).toBe('strong');
    expect(nextjsRec!.score).toBeGreaterThanOrEqual(95);
    expect(nextjsRec!.score).toBeLessThanOrEqual(100);
  });

  it('should rank recommendations correctly by score descending', () => {
    const recs = getRecommendations(['react']);

    for (let i = 0; i < recs.length - 1; i++) {
      expect(recs[i].score).toBeGreaterThanOrEqual(recs[i + 1].score);
    }
  });

  it('should provide category, strength, and reasons correctly', () => {
    const recs = getRecommendations(['react']);
    const tailwindRec = recs.find((r) => r.id === 'tailwindcss');

    expect(tailwindRec).toBeDefined();
    expect(tailwindRec!.category).toBe('Styling');
    expect(tailwindRec!.strength).toBe('strong');
    expect(tailwindRec!.reasons.length).toBeGreaterThan(0);
  });

  it('should combine and deduplicate reasons from multiple sources', () => {
    const recs = getRecommendations(['react', 'nextjs']);
    const tailwindRec = recs.find((r) => r.id === 'tailwindcss');

    expect(tailwindRec).toBeDefined();
    expect(tailwindRec!.reasons.length).toBeGreaterThan(0);

    const uniqueReasons = new Set(tailwindRec!.reasons);
    expect(uniqueReasons.size).toBe(tailwindRec!.reasons.length);
  });
});
