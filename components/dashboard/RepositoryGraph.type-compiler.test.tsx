import { describe, it, expectTypeOf } from 'vitest';
import { ComponentProps } from 'react';
import RepositoryGraph from './RepositoryGraph';
import type { GraphNode, GraphLink } from '@/types';

describe('RepositoryGraph TypeScript Compiler Validation', () => {
  type Props = ComponentProps<typeof RepositoryGraph>;

  it('enforces field property configurations on RepositoryGraphProps', () => {
    // data is required and must have nodes and links arrays
    expectTypeOf<Props>().toHaveProperty('data');
    expectTypeOf<Props['data']>().toHaveProperty('nodes');
    expectTypeOf<Props['data']>().toHaveProperty('links');
    expectTypeOf<Props['data']['nodes']>().toEqualTypeOf<GraphNode[]>();
    expectTypeOf<Props['data']['links']>().toEqualTypeOf<GraphLink[]>();
  });

  it('blocks invalid prop parameters during static type checking', () => {
    // @ts-expect-error - missing required data prop entirely
    const missingData: Props = {};

    // @ts-expect-error - missing links array in data prop
    const missingLinks: Props = { data: { nodes: [] } };

    // @ts-expect-error - nodes must strictly be of type GraphNode[]
    const invalidNodes: Props = { data: { nodes: [1, 2, 3], links: [] } };

    expectTypeOf(missingData).toBeObject();
    expectTypeOf(missingLinks).toBeObject();
    expectTypeOf(invalidNodes).toBeObject();
  });

  it('verifies GraphNode custom type accepts optional values without compile errors', () => {
    const validNodeWithOptionals: GraphNode = {
      id: '1',
      name: 'TestNode',
      type: 'Repo',
      val: 10,
      color: '#ffffff',
      stats: {
        stars: 100,
        forks: 50,
      },
      x: 10,
      y: 20,
    };

    const validNodeWithoutOptionals: GraphNode = {
      id: '2',
      name: 'MinimalNode',
      type: 'User',
      val: 5,
      color: '#000000',
    };

    // Both should satisfy the GraphNode interface cleanly
    expectTypeOf(validNodeWithOptionals).toMatchTypeOf<GraphNode>();
    expectTypeOf(validNodeWithoutOptionals).toMatchTypeOf<GraphNode>();
  });

  it('blocks invalid GraphNode type assignments during strict type checking', () => {
    const invalidTypeNode: GraphNode = {
      id: '3',
      name: 'InvalidNode',
      // @ts-expect-error - type must be one of the strict string literal unions (User, Repo, Contribution, Fork)
      type: 'InvalidType',
      val: 1,
      color: '#ff0000',
    };

    expectTypeOf(invalidTypeNode).toBeObject();
  });

  it('verifies GraphLink schema constraints accept both string ID references and nested GraphNode objects', () => {
    const linkWithStringRefs: GraphLink = {
      source: 'node1',
      target: 'node2',
    };

    const linkWithObjectRefs: GraphLink = {
      source: { id: 'node1', name: 'N1', type: 'User', val: 1, color: '#111' },
      target: { id: 'node2', name: 'N2', type: 'Repo', val: 2, color: '#222' },
    };

    expectTypeOf(linkWithStringRefs).toMatchTypeOf<GraphLink>();
    expectTypeOf(linkWithObjectRefs).toMatchTypeOf<GraphLink>();
  });
});
