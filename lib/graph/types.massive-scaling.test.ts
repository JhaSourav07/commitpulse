import { describe, expect, it } from 'vitest';
import {
  GraphNode,
  GraphEdge,
  RecommendedTechnology,
  RecommendationCategory,
  RecommendationStrength,
} from './types';

describe('LibGraphTypes - Massive Data Sets & Extreme High Bounds Scaling', () => {
  it('handles 1000 GraphNodes', () => {
    const totalNodes = 1000;
    const stableCategories: RecommendationCategory[] = [
      'Frontend',
      'Backend',
      'Database',
      'Styling',
      'Tooling',
    ];
    const stableStrengths: RecommendationStrength[] = ['strong', 'moderate', 'weak'];

    const nodeTree: GraphNode[] = [];

    for (let i = 0; i < totalNodes; i++) {
      const edges: GraphEdge[] = [
        {
          targetId: `target-node-${i}`,
          score: 0.85,
          strength: stableStrengths[i % stableStrengths.length],
          category: stableCategories[i % stableCategories.length],
          reasons: [`Deterministic reason line verification for index marker: ${i}`],
        },
      ];

      nodeTree.push({
        id: `source-node-${i}`,
        edges,
      });
    }

    expect(nodeTree).toHaveLength(totalNodes);
    expect(nodeTree[999].id).toBe('source-node-999');
    expect(nodeTree[999].edges[0].score).toBe(0.85);
  });

  it('supports 10000 GraphEdges', () => {
    const totalEdges = 10000;
    const multiEdgeCollection: GraphEdge[] = [];

    for (let i = 0; i < totalEdges; i++) {
      multiEdgeCollection.push({
        targetId: `node-link-id-${i}`,
        score: i / totalEdges,
        strength: 'moderate',
        category: 'Database',
        reasons: [],
      });
    }

    const centralizedNode: GraphNode = {
      id: 'core-hub-root',
      edges: multiEdgeCollection,
    };

    expect(centralizedNode.edges).toHaveLength(totalEdges);
    expect(centralizedNode.edges[5000].targetId).toBe('node-link-id-5000');
    expect(centralizedNode.edges[9999].category).toBe('Database');
  });

  it('scales RecommendedTechnology arrays', () => {
    const totalTechItems = 5000;
    const recommendationsList: RecommendedTechnology[] = [];

    for (let i = 0; i < totalTechItems; i++) {
      recommendationsList.push({
        id: `framework-id-${i}`,
        score: 95,
        strength: 'strong',
        category: 'Frontend',
        reasons: [
          'Highly optimized framework structure alignment matches profile score metrics perfectly.',
        ],
      });
    }

    expect(recommendationsList).toHaveLength(totalTechItems);
    expect(recommendationsList[2500].score).toBe(95);
    expect(recommendationsList[4999].category).toBe('Frontend');
  });

  it('supports large reasons arrays', () => {
    const maximumReasonItems = 2500;

    const largeReasonsArray: string[] = Array.from(
      { length: maximumReasonItems },
      (_, idx) =>
        `Trace record line sequence identification pointer marker tag reference payload number #${idx}`
    );

    const packedTechProfile: RecommendedTechnology = {
      id: 'extreme-payload-container-node',
      score: 100,
      strength: 'strong',
      category: 'Tooling',
      reasons: largeReasonsArray,
    };

    expect(packedTechProfile.reasons).toHaveLength(maximumReasonItems);
    expect(packedTechProfile.reasons[2499]).toContain('payload number #2499');
  });

  it('supports high index lookups', () => {
    const scaleBoundLimit = 25000;

    const massiveScalingCollection: RecommendedTechnology[] = Array.from(
      { length: scaleBoundLimit },
      (_, idx) => ({
        id: `node-element-key-${idx}`,
        score: 50,
        strength: 'weak',
        category: 'Styling',
        reasons: [],
      })
    );

    const boundaryTerminalNode = massiveScalingCollection[24999];
    expect(boundaryTerminalNode.id).toBe('node-element-key-24999');
    expect(boundaryTerminalNode.category).toBe('Styling');
    expect(boundaryTerminalNode.score).toBe(50);
  });
});
