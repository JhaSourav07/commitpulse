/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import RepositoryGraph from './RepositoryGraph';
import type { GraphNode, GraphLink } from '@/types';

// Mock next/dynamic so ForceGraph2D renders synchronously and never touches the real canvas library
vi.mock('next/dynamic', () => {
  const DynamicForceGraphMock = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      centerAt: vi.fn(),
      zoom: vi.fn(),
    }));

    return (
      <div data-testid="force-graph-2d">
        {props.graphData?.nodes?.map((node: any) => (
          <span key={node.id} data-testid={`graph-node-${node.id}`}>
            {node.name}
          </span>
        ))}
      </div>
    );
  });
  DynamicForceGraphMock.displayName = 'ForceGraph2D';
  return {
    default: () => DynamicForceGraphMock,
  };
});

// Make container dimensions deterministic in jsdom
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  value: 800,
});

describe('RepositoryGraph - Edge Cases & Empty/Missing Inputs (Variation 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the fallback UI when nodes array is completely empty', () => {
    const emptyData = { nodes: [] as GraphNode[], links: [] as GraphLink[] };
    render(<RepositoryGraph data={emptyData} />);

    // Fallback message must be visible
    expect(screen.getByText('No repository relationship data available yet.')).toBeDefined();

    // The actual force graph must NOT render
    expect(screen.queryByTestId('force-graph-2d')).toBeNull();
  });

  it('renders the fallback UI when only a single User node is provided (nodes.length <= 1)', () => {
    const singleNodeData = {
      nodes: [
        { id: 'user1', name: 'Solo User', type: 'User', val: 30, color: '#FFF' },
      ] as GraphNode[],
      links: [] as GraphLink[],
    };
    render(<RepositoryGraph data={singleNodeData} />);

    expect(screen.getByText('No repository relationship data available yet.')).toBeDefined();
    // Header of the full graph view should NOT appear in fallback state
    expect(screen.queryByText('🌐 Repository Dependency Graph')).toBeNull();
  });

  it('renders the fallback container with the correct DOM structure and styling markers', () => {
    const emptyData = { nodes: [] as GraphNode[], links: [] as GraphLink[] };
    const { container } = render(<RepositoryGraph data={emptyData} />);

    const fallback = container.querySelector('div.border-dashed');
    // Key DOM markers exist for the empty/fallback state
    expect(fallback).not.toBeNull();
    expect(fallback?.className).toContain('rounded-xl');
    expect(fallback?.className).toContain('flex');

    // The Box icon (lucide-react) should be rendered inside fallback as an svg
    const icon = fallback?.querySelector('svg');
    expect(icon).not.toBeNull();
  });

  it('does not throw runtime errors or hydration failures with missing/empty links', () => {
    const dataWithMissingLinks = {
      nodes: [] as GraphNode[],
      links: [] as GraphLink[],
    };

    // The render itself must complete without throwing
    expect(() => render(<RepositoryGraph data={dataWithMissingLinks} />)).not.toThrow();
    expect(screen.getByText('No repository relationship data available yet.')).toBeDefined();
  });

  it('keeps fallback UI stable even when nodes contain a single non-User node (still <= 1)', () => {
    const singleRepoData = {
      nodes: [
        {
          id: 'repo-only',
          name: 'Lonely Repo',
          type: 'Repo',
          val: 10,
          color: '#FFF',
          stats: { stars: 0, forks: 0 },
        },
      ] as GraphNode[],
      links: [] as GraphLink[],
    };

    render(<RepositoryGraph data={singleRepoData} />);

    // Fallback should still show since nodes.length <= 1
    expect(screen.getByText('No repository relationship data available yet.')).toBeDefined();
    // No interactive filter buttons should be rendered in fallback state
    expect(screen.queryByText('Personal')).toBeNull();
    expect(screen.queryByText('Contributions')).toBeNull();
    expect(screen.queryByText('Forks')).toBeNull();
  });
});
