import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RepositoryGraph from './RepositoryGraph';

/**
 * Mock ForceGraph2D
 */
vi.mock('react-force-graph-2d', () => ({
  default: () => <div data-testid="force-graph" />,
}));

const mockData = {
  nodes: [
    {
      id: 'user',
      name: 'Test User',
      type: 'User',
      color: '#ffffff',
      val: 10,
    },
    {
      id: 'repo-1',
      name: 'Repository One',
      type: 'Repo',
      color: '#3B82F6',
      val: 20,
      stats: {
        stars: 100,
        forks: 20,
        language: 'TypeScript',
      },
    },
  ],
  links: [
    {
      source: 'user',
      target: 'repo-1',
    },
  ],
};

describe('RepositoryGraph - Theme Contrast', () => {
  it('renders correctly in light mode', () => {
    document.documentElement.classList.remove('dark');

    render(<RepositoryGraph data={mockData} />);

    expect(
      screen.getByRole('region', {
        name: /repository relationship graph/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/repository dependency graph/i)).toBeInTheDocument();
  });

  it('renders correctly in dark mode', () => {
    document.documentElement.classList.add('dark');

    render(<RepositoryGraph data={mockData} />);

    expect(
      screen.getByRole('region', {
        name: /repository relationship graph/i,
      })
    ).toBeInTheDocument();

    document.documentElement.classList.remove('dark');
  });

  it('contains theme-aware dark and light styling classes', () => {
    const { container } = render(<RepositoryGraph data={mockData} />);

    const graphContainer = screen.getByTestId('repository-graph-container');

    expect(graphContainer.className).toContain('bg-white');
    expect(graphContainer.className).toContain('dark:bg-[#0a0a0a]');
    expect(graphContainer.className).toContain('dark:border-[rgba(255,255,255,0.08)]');

    expect(container).toBeInTheDocument();
  });

  it('maintains accessible text contrast elements', () => {
    render(<RepositoryGraph data={mockData} />);

    expect(
      screen.getByText(/visualize your github ecosystem and contribution network/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/graph insights/i)).toBeInTheDocument();
  });

  it('renders filter buttons with visible theme-safe styling', () => {
    render(<RepositoryGraph data={mockData} />);

    const personalButton = screen.getByRole('button', {
      name: /toggle personal repositories/i,
    });

    const contributionButton = screen.getByRole('button', {
      name: /toggle contributions repositories/i,
    });

    const forksButton = screen.getByRole('button', {
      name: /toggle forks repositories/i,
    });

    expect(personalButton).toBeInTheDocument();
    expect(contributionButton).toBeInTheDocument();
    expect(forksButton).toBeInTheDocument();

    expect(personalButton).toHaveAttribute('aria-pressed', 'true');
    expect(contributionButton).toHaveAttribute('aria-pressed', 'true');
    expect(forksButton).toHaveAttribute('aria-pressed', 'true');
  });
});
