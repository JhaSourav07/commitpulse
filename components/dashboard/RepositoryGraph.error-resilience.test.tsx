/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import RepositoryGraph from './RepositoryGraph';
import type { GraphNode, GraphLink } from '@/types';

vi.mock('next/dynamic', () => {
  const DynamicForceGraphMock = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      centerAt: vi.fn(),
      zoom: vi.fn(),
    }));

    return (
      <div data-testid="force-graph-2d">
        {props.graphData?.nodes?.map((node: any) => (
          <button
            key={node.id}
            data-testid={`graph-node-${node.id}`}
            onClick={() => props.onNodeClick?.(node)}
            onMouseEnter={() => props.onNodeHover?.(node)}
            onMouseLeave={() => props.onNodeHover?.(null)}
          >
            {node.name}
          </button>
        ))}
      </div>
    );
  });

  DynamicForceGraphMock.displayName = 'ForceGraph2D';

  return {
    default: () => DynamicForceGraphMock,
  };
});

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  value: 800,
});

describe('RepositoryGraph Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback UI when nodes array is empty', () => {
    render(
      <RepositoryGraph
        data={{
          nodes: [],
          links: [],
        }}
      />
    );

    expect(screen.getByText('No repository relationship data available yet.')).toBeDefined();
  });

  it('handles repositories with missing stats safely', () => {
    const data = {
      nodes: [
        {
          id: 'user1',
          name: 'User',
          type: 'User',
          val: 10,
          color: '#fff',
        },
        {
          id: 'repo1',
          name: 'Repo Without Stats',
          type: 'Repo',
          val: 10,
          color: '#fff',
        },
      ] as GraphNode[],
      links: [{ source: 'user1', target: 'repo1' }] as GraphLink[],
    };

    render(<RepositoryGraph data={data} />);

    expect(screen.getByText('🌐 Repository Dependency Graph')).toBeDefined();
  });

  it('handles hover on nodes with incomplete metadata', () => {
    const data = {
      nodes: [
        {
          id: 'user1',
          name: 'User',
          type: 'User',
          val: 10,
          color: '#fff',
        },
        {
          id: 'repo1',
          name: 'Incomplete Repo',
          type: 'Repo',
          val: 10,
          color: '#fff',
          stats: {},
        },
      ] as GraphNode[],
      links: [{ source: 'user1', target: 'repo1' }] as GraphLink[],
    };

    render(<RepositoryGraph data={data} />);

    fireEvent.mouseEnter(screen.getByTestId('graph-node-repo1'));

    expect(screen.getAllByText('Incomplete Repo').length).toBeGreaterThan(0);
  });

  it('ignores links that reference missing nodes', () => {
    const data = {
      nodes: [
        {
          id: 'user1',
          name: 'User',
          type: 'User',
          val: 10,
          color: '#fff',
        },
        {
          id: 'repo1',
          name: 'Repo',
          type: 'Repo',
          val: 10,
          color: '#fff',
        },
      ] as GraphNode[],
      links: [
        { source: 'user1', target: 'repo1' },
        { source: 'missing-node', target: 'repo1' },
      ] as GraphLink[],
    };

    render(<RepositoryGraph data={data} />);

    expect(screen.getByTestId('graph-node-repo1')).toBeDefined();
  });

  it('remains stable during repeated filter interactions', () => {
    const data = {
      nodes: [
        { id: 'user1', name: 'User', type: 'User', val: 10, color: '#fff' },
        { id: 'repo1', name: 'Repo', type: 'Repo', val: 10, color: '#fff' },
        {
          id: 'contrib1',
          name: 'Contribution',
          type: 'Contribution',
          val: 10,
          color: '#fff',
        },
        {
          id: 'fork1',
          name: 'Fork',
          type: 'Fork',
          val: 10,
          color: '#fff',
        },
      ] as GraphNode[],
      links: [] as GraphLink[],
    };

    render(<RepositoryGraph data={data} />);

    const personal = screen.getByText('Personal');
    const contributions = screen.getByText('Contributions');
    const forks = screen.getByText('Forks');

    for (let i = 0; i < 5; i++) {
      fireEvent.click(personal);
      fireEvent.click(contributions);
      fireEvent.click(forks);
    }

    expect(screen.getByText('🌐 Repository Dependency Graph')).toBeDefined();
  });
});
