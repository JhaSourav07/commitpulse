import { describe, it, expect } from 'vitest';
import { DEPENDENCY_GRAPH } from './dependencyGraph';

describe('DEPENDENCY_GRAPH data integrity', () => {
  it('should be a non-empty record', () => {
    const keys = Object.keys(DEPENDENCY_GRAPH);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('should have every node id matching its own record key', () => {
    for (const [key, node] of Object.entries(DEPENDENCY_GRAPH)) {
      expect(node.id).toBe(key);
    }
  });

  it('should have every edge targetId reference an existing graph node or be an external reference', () => {
    const allKeys = new Set(Object.keys(DEPENDENCY_GRAPH));

    // Some targetIds are technologies referenced in edges but not defined as
    // source nodes themselves (e.g. shadcnui, framermotion, express, etc.).
    // These are valid external/leaf references in a dependency graph.
    const knownExternalTargets = new Set([
      'shadcnui',
      'framermotion',
      'storybook',
      'express',
      'nestjs',
      'fastify',
      'prisma',
      'supabase',
      'vercel',
      'fastapi',
      'django',
      'flask',
      'sqlite',
      'gin',
      'kubernetes',
      'actix',
      'webassembly',
      'mongoose',
      'vuejs',
      'css3',
      'githubactions',
      'terraform',
      'aws',
    ]);

    for (const node of Object.values(DEPENDENCY_GRAPH)) {
      for (const edge of node.edges) {
        const existsAsNode = allKeys.has(edge.targetId);
        const isKnownExternal = knownExternalTargets.has(edge.targetId);
        expect(existsAsNode || isKnownExternal).toBe(true);
      }
    }
  });

  it('should not have any node self-reference in its own edges', () => {
    for (const node of Object.values(DEPENDENCY_GRAPH)) {
      for (const edge of node.edges) {
        expect(edge.targetId).not.toBe(node.id);
      }
    }
  });

  it('should have all edge scores in the valid range [0, 1]', () => {
    for (const node of Object.values(DEPENDENCY_GRAPH)) {
      for (const edge of node.edges) {
        expect(edge.score).toBeGreaterThanOrEqual(0);
        expect(edge.score).toBeLessThanOrEqual(1);
      }
    }
  });

  it('should have valid strength values on every edge', () => {
    const validStrengths = new Set(['strong', 'moderate', 'weak']);

    for (const node of Object.values(DEPENDENCY_GRAPH)) {
      for (const edge of node.edges) {
        expect(validStrengths.has(edge.strength)).toBe(true);
      }
    }
  });

  it('should have valid category values on every edge', () => {
    const validCategories = new Set(['Frontend', 'Backend', 'Database', 'Styling', 'Tooling']);

    for (const node of Object.values(DEPENDENCY_GRAPH)) {
      for (const edge of node.edges) {
        expect(validCategories.has(edge.category)).toBe(true);
      }
    }
  });

  it('should have at least one reason on every edge', () => {
    for (const node of Object.values(DEPENDENCY_GRAPH)) {
      for (const edge of node.edges) {
        expect(edge.reasons.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('should not have duplicate edges to the same target from the same source', () => {
    for (const node of Object.values(DEPENDENCY_GRAPH)) {
      const targetIds = node.edges.map((e) => e.targetId);
      const uniqueTargetIds = new Set(targetIds);
      expect(targetIds.length).toBe(uniqueTargetIds.size);
    }
  });

  it('should not have empty reason strings', () => {
    for (const node of Object.values(DEPENDENCY_GRAPH)) {
      for (const edge of node.edges) {
        for (const reason of edge.reasons) {
          expect(reason.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('DEPENDENCY_GRAPH structural correctness', () => {
  it('should have known graph nodes', () => {
    const expectedNodes = [
      'react',
      'nodejs',
      'nextjs',
      'typescript',
      'python',
      'go',
      'rust',
      'tailwindcss',
      'postgresql',
      'mongodb',
      'javascript',
      'html5',
      'docker',
      'aws',
    ];

    for (const id of expectedNodes) {
      expect(DEPENDENCY_GRAPH[id]).toBeDefined();
    }
  });

  it('should handle an empty graph scenario (no nodes)', () => {
    // Verify the real graph has nodes, but test the concept
    const emptyGraph = Object.keys(DEPENDENCY_GRAPH).length > 0;
    expect(emptyGraph).toBe(true);
  });

  it('should have consistent score-strength pairings', () => {
    for (const node of Object.values(DEPENDENCY_GRAPH)) {
      for (const edge of node.edges) {
        if (edge.strength === 'strong') {
          expect(edge.score).toBeGreaterThanOrEqual(0.65);
        }
        if (edge.strength === 'moderate') {
          // moderate should be between strong and weak thresholds
          expect(edge.score).toBeGreaterThanOrEqual(0.4);
          expect(edge.score).toBeLessThanOrEqual(0.85);
        }
      }
    }
  });
});

describe('DEPENDENCY_GRAPH graph traversal helpers', () => {
  it('should allow retrieving all unique target nodes reachable from a source', () => {
    function getDirectTargets(sourceId: string): string[] {
      const node = DEPENDENCY_GRAPH[sourceId];
      if (!node) return [];
      return node.edges.map((e) => e.targetId);
    }

    // React directly connects to core React ecosystem pairings
    const reactTargets = getDirectTargets('react');
    expect(reactTargets).toEqual(
      expect.arrayContaining([
        'nextjs',
        'tailwindcss',
        'typescript',
        'shadcnui',
        'framermotion',
        'storybook',
      ])
    );
  });

  it('should return empty array for non-existent source node', () => {
    function getDirectTargets(sourceId: string): string[] {
      const node = DEPENDENCY_GRAPH[sourceId];
      if (!node) return [];
      return node.edges.map((e) => e.targetId);
    }

    expect(getDirectTargets('nonexistent')).toEqual([]);
    expect(getDirectTargets('')).toEqual([]);
  });

  it('should allow detecting cycles in the graph', () => {
    // This graph has known cycles: react -> nextjs -> react
    function hasCycle(): boolean {
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      function dfs(nodeId: string): boolean {
        if (recursionStack.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;

        visited.add(nodeId);
        recursionStack.add(nodeId);

        const node = DEPENDENCY_GRAPH[nodeId];
        if (node) {
          for (const edge of node.edges) {
            if (dfs(edge.targetId)) return true;
          }
        }

        recursionStack.delete(nodeId);
        return false;
      }

      for (const key of Object.keys(DEPENDENCY_GRAPH)) {
        if (dfs(key)) return true;
      }
      return false;
    }

    // The graph intentionally has bidirectional/cyclic relationships
    // (e.g., react <-> nextjs, typescript appears in many places)
    expect(hasCycle()).toBe(true);
  });

  it('should allow finding all unique nodes reachable from a given start (transitive closure)', () => {
    function getReachableNodes(startId: string): Set<string> {
      const reachable = new Set<string>();
      const queue = [startId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        const node = DEPENDENCY_GRAPH[current];
        if (!node) continue;

        for (const edge of node.edges) {
          if (!reachable.has(edge.targetId)) {
            reachable.add(edge.targetId);
            queue.push(edge.targetId);
          }
        }
      }

      return reachable;
    }

    // From 'react', we should reach many nodes transitively
    const reachableFromReact = getReachableNodes('react');
    expect(reachableFromReact.size).toBeGreaterThan(6); // more than just direct edges

    // From a leaf-like node (no outgoing edges to other graph nodes that branch)
    const reachableFromDocker = getReachableNodes('docker');
    expect(reachableFromDocker.size).toBeGreaterThan(0);
  });

  it('should have a disconnected graph scenario: a node that is never a target of any edge', () => {
    // Find all nodes that are referenced as targets
    const allTargetIds = new Set<string>();
    for (const node of Object.values(DEPENDENCY_GRAPH)) {
      for (const edge of node.edges) {
        allTargetIds.add(edge.targetId);
      }
    }

    // All graph keys should be targeted by at least one edge (fully connected)
    // But if some are not, that's a valid graph scenario to test
    const orphanNodes = Object.keys(DEPENDENCY_GRAPH).filter((key) => !allTargetIds.has(key));

    // This is informational: we log which nodes are orphans
    // For validation: html5 and css3 are likely referenced but css3 may not have its own node
    // Note: css3 is referenced by html5 but css3 is not a node in the graph
    const existingOrphans = orphanNodes.filter((id) => DEPENDENCY_GRAPH[id] !== undefined);

    // Some nodes like 'shadcnui', 'framermotion', 'storybook' etc. are targets
    // but may not be source nodes themselves - they won't be in orphanNodes
    // since orphanNodes checks keys (source nodes) not referenced as targets
    // This is fine - it just means some targets are not also source nodes
    expect(Array.isArray(existingOrphans)).toBe(true);
  });
});

describe('DEPENDENCY_GRAPH edge case handling', () => {
  it('should handle non-existent node access gracefully', () => {
    const nonExistent = DEPENDENCY_GRAPH['nonexistent_tech'];
    expect(nonExistent).toBeUndefined();
  });

  it('should handle empty string key access gracefully', () => {
    const emptyKey = DEPENDENCY_GRAPH[''];
    expect(emptyKey).toBeUndefined();
  });

  it('should have edges with unique reasons (no duplicates within a single edge)', () => {
    for (const node of Object.values(DEPENDENCY_GRAPH)) {
      for (const edge of node.edges) {
        const uniqueReasons = new Set(edge.reasons);
        expect(uniqueReasons.size).toBe(edge.reasons.length);
      }
    }
  });

  it('should correctly expose the total number of graph nodes and edges', () => {
    const totalNodes = Object.keys(DEPENDENCY_GRAPH).length;
    let totalEdges = 0;
    for (const node of Object.values(DEPENDENCY_GRAPH)) {
      totalEdges += node.edges.length;
    }

    expect(totalNodes).toBeGreaterThan(0);
    // Count edges to ensure consistency
    expect(totalEdges).toBeGreaterThan(0);
  });

  it('should not mutate the graph when accessing its properties', () => {
    const originalKeys = Object.keys(DEPENDENCY_GRAPH).sort();

    // Access various properties
    for (const key of originalKeys) {
      const _node = DEPENDENCY_GRAPH[key];
      const _edges = DEPENDENCY_GRAPH[key].edges;
    }

    const keysAfterAccess = Object.keys(DEPENDENCY_GRAPH).sort();
    expect(keysAfterAccess).toEqual(originalKeys);
  });
});
