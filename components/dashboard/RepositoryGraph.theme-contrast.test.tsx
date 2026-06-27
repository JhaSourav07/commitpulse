import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { GraphNode, GraphLink } from '@/types';
import RepositoryGraph from './RepositoryGraph';

// Mock ForceGraph
vi.mock('react-force-graph-2d', () => ({
  default: () => <div data-testid="force-graph" />,
}));

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="force-graph" />,
}));

const mockData: {
  nodes: GraphNode[];
  links: GraphLink[];
} = {
  nodes: [
    {
      id: '1',
      name: 'octocat',
      type: 'User',
      color: '#fff',
      val: 10,
    },
    {
      id: '2',
      name: 'repo-1',
      type: 'Repo',
      color: '#3B82F6',
      val: 5,
      stats: {
        stars: 100,
        forks: 20,
        language: 'TypeScript',
      },
    },
  ],
  links: [
    {
      source: '1',
      target: '2',
    },
  ],
};

describe('RepositoryGraph Theme Contrast', () => {
  it('applies dark mode heading text contrast styling', () => {
    render(<RepositoryGraph data={mockData} />);

    const heading = screen.getByText(/Repository Dependency Graph/i);

    expect(heading.className).toContain('text-gray-900');
    expect(heading.className).toContain('dark:text-white');
  });

  it('applies dark mode graph container styling', () => {
    render(<RepositoryGraph data={mockData} />);

    const container = screen.getByTestId('repository-graph-container');

    expect(container.className).toContain('bg-white');
    expect(container.className).toContain('dark:bg-[#0a0a0a]');
    expect(container.className).toContain('dark:border-[rgba(255,255,255,0.08)]');
  });

  it('applies light mode border and background contrast styling', () => {
    render(<RepositoryGraph data={mockData} />);

    const container = screen.getByTestId('repository-graph-container');

    expect(container.className).toContain('bg-white');
    expect(container.className).toContain('border-black/10');
  });

  it('applies dark mode insights panel contrast styling', () => {
    render(<RepositoryGraph data={mockData} />);

    const insightsHeading = screen.getByText('Graph Insights');

    const panel = insightsHeading.closest('div')?.parentElement;

    expect(panel?.className).toContain('bg-white');
    expect(panel?.className).toContain('dark:bg-[#0a0a0a]');
    expect(panel?.className).toContain('dark:border-[rgba(255,255,255,0.08)]');
  });

  it('maintains readable muted text styling in both themes', () => {
    render(<RepositoryGraph data={mockData} />);

    const description = screen.getByText(/Visualize your GitHub ecosystem/i);

    expect(description.className).toContain('text-gray-500');
    expect(description.className).toContain('dark:text-zinc-400');
  });
});
