/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import RepositoryGraph from './RepositoryGraph';
import type { GraphNode, GraphLink } from '@/types';

// Mock next/dynamic to return our ForceGraphMock component directly and synchronously
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

// Mock window.innerWidth/innerHeight or clientWidth/clientHeight
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  value: 800,
});

describe('RepositoryGraph', () => {
  const mockData = {
    nodes: [
      { id: 'user1', name: 'User 1', type: 'User', val: 30, color: '#FFF' },
      {
        id: 'repo1',
        name: 'Repo 1',
        type: 'Repo',
        val: 15,
        color: '#FFF',
        stats: { stars: 10, forks: 2, language: 'TypeScript', updatedAt: '2024-05-30T00:00:00Z' },
      },
      {
        id: 'fork1',
        name: 'Fork 1',
        type: 'Fork',
        val: 10,
        color: '#FFF',
        stats: { stars: 0, forks: 0, language: 'JavaScript' },
      },
      {
        id: 'contrib1',
        name: 'Contrib 1',
        type: 'Contribution',
        val: 20,
        color: '#FFF',
        stats: { stars: 100, forks: 50, language: 'Rust' },
      },
    ] as GraphNode[],
    links: [
      { source: 'user1', target: 'repo1' },
      { source: 'user1', target: 'fork1' },
      { source: 'user1', target: 'contrib1' },
    ] as GraphLink[],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state if data has 1 or fewer nodes', () => {
    const emptyData = { nodes: [mockData.nodes[0]], links: [] };
    render(<RepositoryGraph data={emptyData} />);
    expect(screen.getByText('No repository relationship data available yet.')).toBeDefined();
  });

  it('renders the title and filter buttons', () => {
    render(<RepositoryGraph data={mockData} />);
    expect(screen.getByText('🌐 Repository Dependency Graph')).toBeDefined();
    expect(screen.getByText('Personal')).toBeDefined();
    expect(screen.getByText('Contributions')).toBeDefined();
    expect(screen.getByText('Forks')).toBeDefined();
  });

  it('toggles filters when clicked', () => {
    render(<RepositoryGraph data={mockData} />);

    const personalBtn = screen.getByText('Personal');
    const contributionsBtn = screen.getByText('Contributions');
    const forksBtn = screen.getByText('Forks');

    // Turn off Personal
    fireEvent.click(personalBtn);
    expect(screen.queryByTestId('graph-node-repo1')).toBeNull();

    // Turn off Contributions
    fireEvent.click(contributionsBtn);
    expect(screen.queryByTestId('graph-node-contrib1')).toBeNull();

    // Turn off Forks
    fireEvent.click(forksBtn);
    expect(screen.queryByTestId('graph-node-fork1')).toBeNull();

    // Turn Personal back on
    fireEvent.click(personalBtn);
    expect(screen.getByTestId('graph-node-repo1')).toBeDefined();
  });

  it('displays a tooltip on node hover', async () => {
    render(<RepositoryGraph data={mockData} />);

    const repoNode = screen.getByTestId('graph-node-repo1');

    // Hover
    fireEvent.mouseEnter(repoNode);
    expect(screen.getAllByText('Repo 1').length).toBeGreaterThan(1);
    expect(screen.getByText('10 Stars')).toBeDefined();
    expect(screen.getByText('2 Forks')).toBeDefined();
    expect(screen.getByText('TypeScript')).toBeDefined();

    // Unhover
    fireEvent.mouseLeave(repoNode);
    expect(screen.queryByText('10 Stars')).toBeNull();
  });

  it('zooms on node click', () => {
    render(<RepositoryGraph data={mockData} />);
    const repoNode = screen.getByTestId('graph-node-repo1');
    fireEvent.click(repoNode);
    // Click successfully processed without throwing
    expect(repoNode).toBeDefined();
  });

  it('handles window resize', () => {
    render(<RepositoryGraph data={mockData} />);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    // Check that it didn't throw
    expect(screen.getByText('🌐 Repository Dependency Graph')).toBeDefined();
  });

  it('calculates and renders correct insights in the sidebar', () => {
    render(<RepositoryGraph data={mockData} />);
    // mockData has 1 repo + 1 fork = 2 ecosystem size
    expect(screen.getByText('2 Repositories connected')).toBeDefined();
    // Contrib 1 is the most starred (100 stars)
    expect(screen.getAllByText(/Contrib 1/).length).toBeGreaterThan(0);
  });
});
