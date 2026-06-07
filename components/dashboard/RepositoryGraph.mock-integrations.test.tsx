/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GraphLink, GraphNode } from '@/types';
import RepositoryGraph from './RepositoryGraph';

const graphRenderSpy = vi.fn();

vi.mock('next/dynamic', () => {
  const DynamicForceGraphMock = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      centerAt: vi.fn(),
      zoom: vi.fn(),
    }));

    graphRenderSpy(props.graphData);

    return (
      <div data-testid="force-graph-2d">
        {props.graphData?.nodes?.map((node: any) => (
          <div key={node.id}>{node.name}</div>
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

const mockData = {
  nodes: [
    {
      id: 'user1',
      name: 'User 1',
      type: 'User',
      val: 30,
      color: '#fff',
    },
    {
      id: 'repo1',
      name: 'Repo 1',
      type: 'Repo',
      val: 15,
      color: '#fff',
      stats: {
        stars: 10,
        forks: 2,
      },
    },
    {
      id: 'contrib1',
      name: 'Contribution 1',
      type: 'Contribution',
      val: 12,
      color: '#fff',
      stats: {
        stars: 25,
        forks: 5,
      },
    },
    {
      id: 'fork1',
      name: 'Fork 1',
      type: 'Fork',
      val: 8,
      color: '#fff',
      stats: {
        stars: 3,
        forks: 1,
      },
    },
  ] as GraphNode[],
  links: [
    { source: 'user1', target: 'repo1' },
    { source: 'user1', target: 'contrib1' },
    { source: 'user1', target: 'fork1' },
  ] as GraphLink[],
};

describe('RepositoryGraph mock integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully with mocked dynamic graph integration', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(screen.getByTestId('force-graph-2d')).toBeDefined();
    expect(screen.getByText('User 1')).toBeDefined();
    expect(screen.getByText('Repo 1')).toBeDefined();
  });

  it('passes filtered graph data into the mocked graph dependency', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(graphRenderSpy).toHaveBeenCalled();

    const latestGraphData = graphRenderSpy.mock.calls.at(-1)?.[0];

    expect(latestGraphData.nodes).toHaveLength(4);
    expect(latestGraphData.links).toHaveLength(3);
  });

  it('keeps graph integration stable when unrelated invalid links are ignored', () => {
    const dataWithInvalidLink = {
      nodes: mockData.nodes,
      links: [
        ...mockData.links,
        { source: 'user1', target: 'missing-node' },
        { source: 'ghost-node', target: 'repo1' },
      ] as GraphLink[],
    };

    render(<RepositoryGraph data={dataWithInvalidLink} />);

    const latestGraphData = graphRenderSpy.mock.calls.at(-1)?.[0];

    expect(latestGraphData.nodes).toHaveLength(4);
    expect(latestGraphData.links).toHaveLength(3);
  });

  it('renders empty fallback when graph data is not enough for integration', () => {
    render(<RepositoryGraph data={{ nodes: [mockData.nodes[0]], links: [] }} />);

    expect(screen.getByText(/no repository relationship data available yet/i)).toBeDefined();
    expect(screen.queryByTestId('force-graph-2d')).toBeNull();
  });

  it('renders insight panel from supplied graph data without remote services', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(screen.getByText(/graph insights/i)).toBeDefined();
    expect(screen.getByText(/2 repositories connected/i)).toBeDefined();
    expect(screen.getAllByText(/Contribution 1/i).length).toBeGreaterThan(0);
  });
});
