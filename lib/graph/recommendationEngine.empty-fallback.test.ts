import { describe, expect, it } from 'vitest';
import { getRecommendations } from './recommendationEngine';

describe('Recommendation Engine Empty & Missing Input Fallbacks', () => {
  it('returns an empty array when selectedIds is undefined', () => {
    expect(getRecommendations(undefined as unknown as string[])).toEqual([]);
  });

  it('returns an empty array when selectedIds is null', () => {
    expect(getRecommendations(null as unknown as string[])).toEqual([]);
  });

  it('returns an empty array when all selected technologies are unknown', () => {
    const recommendations = getRecommendations(['unknown-tech', 'another-unknown-tech']);

    expect(recommendations).toEqual([]);
  });

  it('ignores unknown technologies while still processing valid selections', () => {
    const recommendations = getRecommendations(['react', 'unknown-tech']);

    expect(recommendations.length).toBeGreaterThan(0);

    expect(recommendations.some((rec) => rec.id === 'tailwindcss')).toBe(true);
  });

  it('returns stable recommendation objects when no candidate technologies remain', () => {
    const recommendations = getRecommendations([
      'react',
      'nextjs',
      'typescript',
      'tailwindcss',
      'nodejs',
    ]);

    recommendations.forEach((recommendation) => {
      expect(recommendation.id).toBeTruthy();
      expect(recommendation.score).toBeGreaterThanOrEqual(0);
      expect(recommendation.score).toBeLessThanOrEqual(100);
      expect(recommendation.reasons).toBeDefined();
      expect(Array.isArray(recommendation.reasons)).toBe(true);
    });
  });
});
