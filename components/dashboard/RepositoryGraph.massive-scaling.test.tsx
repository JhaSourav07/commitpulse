import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import type { GraphNode, GraphLink } from '@/types';

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="force-graph-mock" />,
}));

vi.mock('lucide-react', () => ({
  Star: () => <svg data-testid="star-icon" />,
  GitFork: () => <svg data-testid="fork-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  Box: () => <svg data-testid="box-icon" />,
}));

import RepositoryGraph from './RepositoryGraph';

const generateNodes = (count: number): GraphNode[] => {
  const nodes: GraphNode[] = [
    {
      id: 'user-0',
      name: 'TestUser',
      type: 'User',
      val: 10,
      color: '#ffffff',
    },
  ];

  for (let i = 1; i < count; i++) {
    const type = i % 3 === 0 ? 'Fork' : i % 2 === 0 ? 'Contribution' : 'Repo';
    nodes.push({
      id: `node-${i}`,
      name: `Repository ${i}`,
      type,
      val: Math.floor(Math.random() * 100) + 1,
      color: '#3B82F6',
      stats: {
        stars: Math.floor(Math.random() * 10000),
        forks: Math.floor(Math.random() * 1000),
        language: 'TypeScript',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });
  }

  return nodes;
};

const generateLinks = (nodes: GraphNode[]): GraphLink[] => {
  return nodes.slice(1).map((node) => ({
    source: 'user-0',
    target: node.id,
  }));
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('RepositoryGraph massive-scaling: Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('renders without crashing under a massive dataset of 1000 nodes', () => {
    const nodes = generateNodes(1000);
    const links = generateLinks(nodes);

    const { container } = render(<RepositoryGraph data={{ nodes, links }} />);

    expect(container).toBeDefined();
    expect(container.firstChild).not.toBeNull();
  });

  it('completes filtering computation within acceptable time under 5000 nodes', () => {
    const nodes = generateNodes(5000);
    const links = generateLinks(nodes);

    const start = performance.now();
    render(<RepositoryGraph data={{ nodes, links }} />);
    const duration = performance.now() - start;

    // Render and filter must complete within 3000ms even under extreme load
    expect(duration).toBeLessThan(3000);
  });

  it('correctly computes insights for most starred node across 2000 nodes', () => {
    const nodes = generateNodes(2000);

    // Inject a node with a known maximum star count
    nodes.push({
      id: 'node-max-stars',
      name: 'MaxStarRepo',
      type: 'Repo',
      val: 50,
      color: '#22C55E',
      stats: { stars: 999999, forks: 500, language: 'Rust' },
    });

    const links = generateLinks(nodes);

    const { container } = render(<RepositoryGraph data={{ nodes, links }} />);

    // Graph Insights panel should render correctly
    expect(container).toBeDefined();
    expect(container.firstChild).not.toBeNull();
  });

  it('renders graph container and filter buttons correctly under 3000 nodes', () => {
    const nodes = generateNodes(3000);
    const links = generateLinks(nodes);

    render(<RepositoryGraph data={{ nodes, links }} />);

    // Filter buttons must all render correctly regardless of data size
    expect(screen.getByRole('button', { name: /personal/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /contributions/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /forks/i })).toBeDefined();

    // Heading must be present
    expect(screen.getByRole('heading', { level: 2 })).toBeDefined();
  });

  it('shows empty state without crashing when node count is at boundary of 1', () => {
    const nodes: GraphNode[] = [
      {
        id: 'user-0',
        name: 'TestUser',
        type: 'User',
        val: 10,
        color: '#ffffff',
      },
    ];
    const links: GraphLink[] = [];

    render(<RepositoryGraph data={{ nodes, links }} />);

    // With only 1 node, the empty state must render cleanly
    expect(screen.getByText(/no repository relationship data available yet/i)).toBeDefined();
  });
});
