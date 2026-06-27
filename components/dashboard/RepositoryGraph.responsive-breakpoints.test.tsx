/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
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
  value: 375,
});

const mockData = {
  nodes: [
    { id: 'user1', name: 'User 1', type: 'User', val: 30, color: '#FFF' },
    {
      id: 'repo1',
      name: 'Repo 1',
      type: 'Repo',
      val: 15,
      color: '#FFF',
      stats: { stars: 10 },
    },
    {
      id: 'fork1',
      name: 'Fork 1',
      type: 'Fork',
      val: 10,
      color: '#FFF',
    },
    {
      id: 'contrib1',
      name: 'Contrib 1',
      type: 'Contribution',
      val: 20,
      color: '#FFF',
    },
  ] as GraphNode[],
  links: [
    { source: 'user1', target: 'repo1' },
    { source: 'user1', target: 'fork1' },
    { source: 'user1', target: 'contrib1' },
  ] as GraphLink[],
};

describe('RepositoryGraph Responsive Breakpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders graph successfully on mobile viewport width', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(screen.getByText('🌐 Repository Dependency Graph')).toBeInTheDocument();
  });

  it('renders filter controls in wrapped mobile layout', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Contributions')).toBeInTheDocument();
    expect(screen.getByText('Forks')).toBeInTheDocument();
  });

  it('renders graph container at mobile width without crashing', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(screen.getByTestId('force-graph-2d')).toBeInTheDocument();
  });

  it('handles resize events correctly on smaller viewports', () => {
    render(<RepositoryGraph data={mockData} />);

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(screen.getByText('🌐 Repository Dependency Graph')).toBeInTheDocument();
  });

  it('keeps desktop insight content available in rendered output', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(screen.getByText('Graph Insights')).toBeInTheDocument();

    expect(screen.getByText(/Repositories connected/i)).toBeInTheDocument();
  });
});
