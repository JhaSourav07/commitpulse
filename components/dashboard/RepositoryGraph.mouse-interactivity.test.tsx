import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { GraphNode } from '@/types';

type ForceGraphProps = {
  onNodeHover?: (node: Record<string, unknown> | null) => void;
  onNodeClick?: (node: Record<string, unknown>) => void;
  [key: string]: unknown;
};

let capturedOnNodeHover: ((node: Record<string, unknown> | null) => void) | null = null;
let capturedOnNodeClick: ((node: Record<string, unknown>) => void) | null = null;

vi.mock('next/dynamic', () => ({
  default: (_fn: unknown, _opts?: unknown) => {
    return function ForceGraphMock(props: ForceGraphProps) {
      capturedOnNodeHover = props.onNodeHover ?? null;
      capturedOnNodeClick = props.onNodeClick ?? null;
      return <div data-testid="force-graph" />;
    };
  },
}));

vi.mock('lucide-react', () => ({
  Star: () => <svg data-testid="icon-star" />,
  GitFork: () => <svg data-testid="icon-gitfork" />,
  Clock: () => <svg data-testid="icon-clock" />,
  Box: () => <svg data-testid="icon-box" />,
}));

import RepositoryGraph from './RepositoryGraph';

const mockData = {
  nodes: [
    { id: 'user1', name: 'octocat', type: 'User', val: 30, color: '#E2E8F0' },
    {
      id: 'repo1',
      name: 'my-repo',
      type: 'Repo',
      val: 10,
      color: '#3B82F6',
      stats: { stars: 42, forks: 5, language: 'TypeScript', updatedAt: '2024-01-15' },
    },
    {
      id: 'contrib1',
      name: 'other-repo',
      type: 'Contribution',
      val: 8,
      color: '#22C55E',
      stats: { stars: 100, forks: 20 },
    },
  ] as GraphNode[],
  links: [
    { source: 'user1', target: 'repo1' },
    { source: 'user1', target: 'contrib1' },
  ],
};

describe('RepositoryGraph — Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  beforeEach(() => {
    capturedOnNodeHover = null;
    capturedOnNodeClick = null;
    vi.clearAllMocks();
  });

  it('clicking an active filter button toggles it to inactive and removes its background colour', () => {
    render(<RepositoryGraph data={mockData} />);

    const personalButton = screen.getByRole('button', { name: 'Personal' });

    expect(personalButton.style.backgroundColor).toBe('rgb(59, 130, 246)');

    fireEvent.click(personalButton);

    expect(personalButton.style.backgroundColor).toBe('');
  });

  it('onNodeHover callback with a node causes the tooltip to appear with the node name and type', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(screen.queryByText('my-repo')).toBeNull();

    act(() => {
      capturedOnNodeHover?.({
        id: 'repo1',
        name: 'my-repo',
        type: 'Repo',
        val: 10,
        color: '#3B82F6',
      });
    });

    expect(screen.getByText('my-repo')).toBeTruthy();
    expect(screen.getByText('Repo')).toBeTruthy();
  });

  it('onNodeHover called with null removes the tooltip from the DOM (mouseleave)', () => {
    render(<RepositoryGraph data={mockData} />);

    act(() => {
      capturedOnNodeHover?.({
        id: 'repo1',
        name: 'my-repo',
        type: 'Repo',
        val: 10,
        color: '#3B82F6',
      });
    });

    expect(screen.getByText('my-repo')).toBeTruthy();

    act(() => {
      capturedOnNodeHover?.(null);
    });

    expect(screen.queryByText('my-repo')).toBeNull();
  });

  it('tooltip displays star count and language from node stats when hovered', () => {
    render(<RepositoryGraph data={mockData} />);

    act(() => {
      capturedOnNodeHover?.({
        id: 'repo1',
        name: 'my-repo',
        type: 'Repo',
        val: 10,
        color: '#3B82F6',
        stats: { stars: 42, forks: 5, language: 'TypeScript', updatedAt: '2024-01-15' },
      });
    });

    expect(screen.getByText('42 Stars')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
    expect(screen.getByText('5 Forks')).toBeTruthy();
  });

  it('onNodeClick callback fires without throwing and the component remains mounted', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(() => {
      act(() => {
        capturedOnNodeClick?.({
          id: 'repo1',
          name: 'my-repo',
          type: 'Repo',
          val: 10,
          color: '#3B82F6',
          x: 100,
          y: 200,
        });
      });
    }).not.toThrow();

    expect(screen.getByTestId('force-graph')).toBeTruthy();
  });
});
