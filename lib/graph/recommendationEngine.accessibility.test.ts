import { describe, it, expect } from 'vitest';
import { getRecommendations } from './recommendationEngine';
import type {
  RecommendedTechnology,
  RecommendationStrength,
  RecommendationCategory,
} from './types';

/**
 * Accessibility & Screen Reader ARIA Compliance tests for getRecommendations.
 *
 * Although getRecommendations is a pure data utility (not a UI component), the
 * shape and ordering of its output directly drive what a screen reader will
 * announce when the recommendations are rendered. These tests therefore guard
 * the data contract that downstream ARIA-labelled UI relies on:
 *   - stable, predictable ordering (so screen readers announce a consistent sequence)
 *   - non-null required fields (so assistive tech never reads "undefined")
 *   - valid enum values for strength/category (so aria-label values stay meaningful)
 *   - deduplicated reasons (so the same description is not announced twice)
 *   - logical score hierarchy (mirrors "headings in correct hierarchical order")
 */
describe('recommendationEngine - Accessibility Standards & Screen Reader ARIA Compliance', () => {
  // Test 1 — Guards against assistive tech reading "undefined" / "null" for any
  // field that would be exposed via aria-label, aria-labelledby or aria-describedby.
  it('produces fully populated fields so ARIA labels never resolve to undefined or null', () => {
    const recommendations: RecommendedTechnology[] = getRecommendations(['react', 'nodejs']);

    expect(recommendations.length).toBeGreaterThan(0);

    recommendations.forEach((rec) => {
      expect(rec.id).toBeTruthy();
      expect(typeof rec.id).toBe('string');
      expect(rec.strength).toBeDefined();
      expect(rec.category).toBeDefined();
      expect(rec.reasons).toBeDefined();
      expect(Array.isArray(rec.reasons)).toBe(true);
    });
  });

  // Test 2 — Strength acts as the semantic role/level a screen reader will
  // announce (e.g. "strong recommendation"). It must only ever be one of the
  // three valid enum values, otherwise the aria-label becomes meaningless.
  it('emits only valid strength values so aria-label tokens remain semantically correct', () => {
    const recommendations = getRecommendations(['react', 'typescript', 'nodejs']);
    const validStrengths: RecommendationStrength[] = ['strong', 'moderate', 'weak'];

    recommendations.forEach((rec) => {
      expect(validStrengths).toContain(rec.strength);
    });
  });

  // Test 3 — Category is what a tooltip / aria-describedby will surface to the
  // user ("Frontend recommendation", "Backend recommendation", ...). An invalid
  // category would be announced as a raw, unreadable token.
  it('emits only valid category values so tooltip / aria-describedby text stays human-readable', () => {
    const recommendations = getRecommendations(['react', 'nodejs', 'tailwindcss']);
    const validCategories: RecommendationCategory[] = [
      'Frontend',
      'Backend',
      'Database',
      'Styling',
      'Tooling',
    ];

    recommendations.forEach((rec) => {
      expect(validCategories).toContain(rec.category);
    });
  });

  // Test 4 — Mirrors the "standard headings exist in the correct logical
  // hierarchical order" rule from the issue. Screen readers traverse the list
  // top-to-bottom, so scores must be monotonically non-increasing — otherwise
  // the announced order would contradict the visual/logical hierarchy.
  it('orders recommendations by descending score so screen reader traversal matches visual hierarchy', () => {
    const recommendations = getRecommendations(['react', 'typescript', 'nodejs']);

    expect(recommendations.length).toBeGreaterThan(1);

    for (let i = 1; i < recommendations.length; i++) {
      expect(recommendations[i - 1].score).toBeGreaterThanOrEqual(recommendations[i].score);
    }
  });

  // Test 5 — Reasons feed directly into aria-describedby. If the same reason
  // appears twice, the screen reader will announce it twice, which is exactly
  // the kind of redundant audio noise WCAG asks us to avoid. Also asserts the
  // tab/keyboard traversal order is deterministic across repeated calls so
  // focus order does not jitter between renders.
  it('deduplicates reasons and produces a deterministic order for stable keyboard tab traversal', () => {
    const first = getRecommendations(['react', 'nodejs', 'typescript']);
    const second = getRecommendations(['react', 'nodejs', 'typescript']);

    // Deterministic ordering — tab/focus sequence must not change between renders
    expect(first.map((r) => r.id)).toEqual(second.map((r) => r.id));

    // No duplicate reasons within a single recommendation
    first.forEach((rec) => {
      const uniqueReasons = new Set(rec.reasons);
      expect(uniqueReasons.size).toBe(rec.reasons.length);
    });
  });
});
