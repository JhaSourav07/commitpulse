import { describe, it, expect } from 'vitest';
import { getRecommendations } from './recommendationEngine';

describe('Recommendation Engine Logic Validation', () => {
  it('returns recommendations with scores within valid percentage range', () => {
    const recommendations = getRecommendations(['react']);

    recommendations.forEach((rec) => {
      expect(rec.score).toBeGreaterThanOrEqual(0);
      expect(rec.score).toBeLessThanOrEqual(100);
    });
  });

  it('returns only valid recommendation strengths', () => {
    const recommendations = getRecommendations(['react']);

    recommendations.forEach((rec) => {
      expect(['weak', 'moderate', 'strong']).toContain(rec.strength);
    });
  });

  it('returns non-empty categories for all recommendations', () => {
    const recommendations = getRecommendations(['react']);

    recommendations.forEach((rec) => {
      expect(rec.category).toBeTruthy();
    });
  });

  it('returns non-empty reasons for every recommendation', () => {
    const recommendations = getRecommendations(['react']);

    recommendations.forEach((rec) => {
      expect(rec.reasons.length).toBeGreaterThan(0);
    });
  });

  it('returns recommendations sorted by score descending', () => {
    const recommendations = getRecommendations(['react']);

    for (let i = 0; i < recommendations.length - 1; i++) {
      expect(recommendations[i].score).toBeGreaterThanOrEqual(recommendations[i + 1].score);
    }
  });
});
