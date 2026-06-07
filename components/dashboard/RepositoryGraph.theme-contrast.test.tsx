import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RepositoryGraph from './RepositoryGraph';
import type { GraphNode, GraphLink } from '@/types';

// Mock force graph
vi.mock('react-force-graph-2d', () => ({
  default: () => <div data-testid="force-graph" />,
}));

const mockData: {
  nodes: GraphNode[];
  links: GraphLink[];
} = {
  nodes: [
    {
      id: 'user',
      name: 'octocat',
      type: 'User',
      color: '#3B82F6',
      val: 10,
    },
    {
      id: 'repo1',
      name: 'awesome-repo',
      type: 'Repo',
      color: '#22C55E',
      val: 20,
      stats: {
        stars: 100,
        forks: 20,
      },
    },
  ],
  links: [
    {
      source: 'user',
      target: 'repo1',
    },
  ],
};

describe('RepositoryGraph theme contrast', () => {
  it('renders repository graph region with accessibility labels', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(
      screen.getByRole('region', {
        name: /repository relationship graph/i,
      })
    ).toBeInTheDocument();
  });

  it('renders heading with dark/light compatible text classes', () => {
    render(<RepositoryGraph data={mockData} />);

    const heading = screen.getByText(/repository dependency graph/i);

    expect(heading.className).toContain('text-gray-900');
    expect(heading.className).toContain('dark:text-white');
  });

  it('renders graph container with contrasting dark and light backgrounds', () => {
    render(<RepositoryGraph data={mockData} />);

    const graphContainer = screen.getByTestId('repository-graph-container');

    expect(graphContainer.className).toContain('bg-white');
    expect(graphContainer.className).toContain('dark:bg-[#0a0a0a]');
  });

  it('renders all filter buttons with visible theme styling', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(
      screen.getByRole('button', {
        name: /toggle personal repositories/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /toggle contributions repositories/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /toggle forks repositories/i,
      })
    ).toBeInTheDocument();
  });

  it('renders graph insights panel using dark/light text contrast classes', () => {
    render(<RepositoryGraph data={mockData} />);

    const title = screen.getByText(/graph insights/i);

    expect(title.className).toContain('text-gray-900');
    expect(title.className).toContain('dark:text-white');
  });
});
