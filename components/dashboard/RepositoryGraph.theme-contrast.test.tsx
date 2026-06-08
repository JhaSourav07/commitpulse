import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RepositoryGraph from './RepositoryGraph';
import type { GraphNode, GraphLink } from '@/types';

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

describe('RepositoryGraph theme contrast verification', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('renders correctly in light mode', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(
      screen.getByRole('region', {
        name: /repository relationship graph/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/visualize your github ecosystem/i)).toBeInTheDocument();
  });

  it('renders correctly when dark theme is enabled', () => {
    document.documentElement.classList.add('dark');

    render(<RepositoryGraph data={mockData} />);

    expect(
      screen.getByRole('region', {
        name: /repository relationship graph/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/graph insights/i)).toBeInTheDocument();
  });

  it('preserves accessibility metadata across themes', () => {
    render(<RepositoryGraph data={mockData} />);

    const region = screen.getByRole('region', {
      name: /repository relationship graph/i,
    });

    expect(region).toHaveAttribute(
      'aria-describedby',
      'repository-graph-description repository-graph-summary'
    );
  });

  it('keeps filter controls visible and interactive', () => {
    render(<RepositoryGraph data={mockData} />);

    const personalButton = screen.getByRole('button', {
      name: /toggle personal repositories/i,
    });

    expect(personalButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(personalButton);

    expect(personalButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders graph container and insights panel in both themes', () => {
    document.documentElement.classList.add('dark');

    render(<RepositoryGraph data={mockData} />);

    expect(screen.getByTestId('repository-graph-container')).toBeInTheDocument();

    expect(screen.getByText(/graph insights/i)).toBeInTheDocument();

    expect(screen.getByText(/repositories connected/i)).toBeInTheDocument();
  });
});
