import { describe, it, expect } from 'vitest';
import { DEPENDENCY_GRAPH } from './dependencyGraph';

describe('Graph Theme Contrast Cohesion', () => {
  it('all nodes have valid ids', () => {
    Object.values(DEPENDENCY_GRAPH).forEach((node) => {
      expect(node.id).toBeTruthy();
    });
  });

  it('all edges use valid recommendation categories', () => {
    const categories = ['Frontend', 'Backend', 'Database', 'Styling', 'Tooling'];

    Object.values(DEPENDENCY_GRAPH).forEach((node) => {
      node.edges.forEach((edge) => {
        expect(categories).toContain(edge.category);
      });
    });
  });

  it('all edges have scores between 0 and 1', () => {
    Object.values(DEPENDENCY_GRAPH).forEach((node) => {
      node.edges.forEach((edge) => {
        expect(edge.score).toBeGreaterThanOrEqual(0);
        expect(edge.score).toBeLessThanOrEqual(1);
      });
    });
  });

  it('all recommendation reasons are non-empty', () => {
    Object.values(DEPENDENCY_GRAPH).forEach((node) => {
      node.edges.forEach((edge) => {
        expect(edge.reasons.length).toBeGreaterThan(0);
      });
    });
  });

  it('all target technologies are unique within a node', () => {
    Object.values(DEPENDENCY_GRAPH).forEach((node) => {
      const targets = node.edges.map((e) => e.targetId);

      expect(new Set(targets).size).toBe(targets.length);
    });
  });
});
