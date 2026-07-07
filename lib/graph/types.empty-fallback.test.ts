import { describe, expect, it } from 'vitest';
import type { GraphEdge, GraphNode, RecommendedTechnology } from './types';

describe('LibGraphTypes Edge Cases & Empty/Missing Inputs Verification', () => {
  it('Case 1: supports GraphNode with empty edges array', () => {
    const node: GraphNode = {
      id: 'react',
      edges: [],
    };

    expect(node.edges).toEqual([]);
  });

  it('Case 2: supports GraphEdge with empty reasons array', () => {
    const edge: GraphEdge = {
      targetId: 'nextjs',
      score: 0,
      strength: 'weak',
      category: 'Frontend',
      reasons: [],
    };

    expect(edge.reasons).toEqual([]);
  });

  it('Case 3: supports GraphEdge with minimum score boundary', () => {
    const edge: GraphEdge = {
      targetId: 'nodejs',
      score: 0,
      strength: 'weak',
      category: 'Backend',
      reasons: [],
    };

    expect(edge.score).toBe(0);
  });

  it('Case 4: supports RecommendedTechnology with empty reasons', () => {
    const recommendation: RecommendedTechnology = {
      id: 'typescript',
      score: 0,
      strength: 'weak',
      category: 'Tooling',
      reasons: [],
    };

    expect(recommendation.reasons).toHaveLength(0);
  });

  it('Case 5: preserves valid object structure with fallback-like values', () => {
    const recommendation: RecommendedTechnology = {
      id: '',
      score: 0,
      strength: 'weak',
      category: 'Database',
      reasons: [],
    };

    expect(recommendation).toMatchObject({
      id: '',
      score: 0,
      reasons: [],
    });
  });
});
