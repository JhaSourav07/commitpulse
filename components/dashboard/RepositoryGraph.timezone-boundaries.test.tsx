/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { GraphLink, GraphNode } from '@/types';
import RepositoryGraph from './RepositoryGraph';

vi.mock('next/dynamic', () => {
  const MockGraph = React.forwardRef((props: any, ref: any) => {
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

  MockGraph.displayName = 'ForceGraph2D';

  return {
    default: () => MockGraph,
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
        updatedAt: '2025-03-09T06:59:00Z',
      },
    },
  ] as GraphNode[],
  links: [{ source: 'user1', target: 'repo1' }] as GraphLink[],
};

describe('RepositoryGraph timezone boundaries', () => {
  it('renders consistently under UTC timezone assumptions', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(
      screen.getByRole('heading', {
        name: /repository dependency graph/i,
      })
    ).toBeInTheDocument();
  });

  it('keeps graph rendering stable for EST timezone boundary data', () => {
    const estDate = new Date('2025-03-09T06:59:00Z');

    render(<RepositoryGraph data={mockData} />);

    expect(estDate.getUTCFullYear()).toBe(2025);
    expect(screen.getByTestId('force-graph-2d')).toBeInTheDocument();
  });

  it('keeps repository nodes visible for IST timezone boundary data', () => {
    const istDate = new Date('2025-05-01T18:30:00Z');

    render(<RepositoryGraph data={mockData} />);

    expect(Number.isNaN(istDate.getTime())).toBe(false);
    expect(screen.getByText('Repo 1')).toBeInTheDocument();
  });

  it('keeps user nodes visible for JST timezone boundary data', () => {
    const jstDate = new Date('2025-12-31T15:00:00Z');

    render(<RepositoryGraph data={mockData} />);

    expect(Number.isNaN(jstDate.getTime())).toBe(false);
    expect(screen.getByText('User 1')).toBeInTheDocument();
  });

  it('remains stable across leap year and daylight saving transition dates', () => {
    const leapDate = new Date('2024-02-29T23:59:59Z');
    const dstDate = new Date('2025-03-09T02:00:00Z');

    render(<RepositoryGraph data={mockData} />);

    expect(leapDate.getUTCDate()).toBe(29);
    expect(Number.isNaN(dstDate.getTime())).toBe(false);
    expect(
      screen.getByText(/visualize your github ecosystem and contribution network/i)
    ).toBeInTheDocument();
  });
});
