import { describe, expect, it } from 'vitest';
import { DEPENDENCY_GRAPH } from './dependencyGraph';

describe('DEPENDENCY_GRAPH Empty & Missing Input Fallbacks', () => {
  it('returns undefined for null-like key access', () => {
    expect(DEPENDENCY_GRAPH[null as unknown as string]).toBeUndefined();
  });

  it('returns undefined for undefined-like key access', () => {
    expect(DEPENDENCY_GRAPH[undefined as unknown as string]).toBeUndefined();
  });

  it('returns undefined for whitespace-only key lookups', () => {
    expect(DEPENDENCY_GRAPH[' ']).toBeUndefined();
    expect(DEPENDENCY_GRAPH['   ']).toBeUndefined();
    expect(DEPENDENCY_GRAPH['\t']).toBeUndefined();
    expect(DEPENDENCY_GRAPH['\n']).toBeUndefined();
  });

  it('safely handles access to missing graph nodes without runtime failures', () => {
    const missingNode = DEPENDENCY_GRAPH['technology-that-does-not-exist'];

    expect(missingNode).toBeUndefined();

    const edges = missingNode?.edges ?? [];

    expect(edges).toEqual([]);
  });

  it('maintains valid fallback graph structure when traversing unknown nodes', () => {
    const requestedNodes = ['', 'unknown-tech', 'missing-node', '   '];

    const resolvedNodes = requestedNodes.map((id) => DEPENDENCY_GRAPH[id]).filter(Boolean);

    expect(resolvedNodes).toEqual([]);

    expect(Object.keys(DEPENDENCY_GRAPH).length).toBeGreaterThan(0);
  });
});
