import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RepositoryContributionExplorer from './RepositoryContributionExplorer';
import { Repository } from '@/types/dashboard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('RepositoryContributionExplorer', () => {
  const mockRepos: Repository[] = [
    {
      name: 'commitpulse',
      description: 'A developer dashboard',
      stargazerCount: 150,
      forkCount: 20,
      url: 'https://github.com/test/commitpulse',
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
    },
    {
      name: 'awesome-project',
      description: null,
      stargazerCount: 50,
      forkCount: 5,
      url: 'https://github.com/test/awesome-project',
      primaryLanguage: null,
    },
  ];

  it('renders the empty fallback state when no repos are provided', () => {
    const { container } = render(<RepositoryContributionExplorer username="testuser" repos={[]} />);
    expect(screen.getByText(/No repository data available to explore/i)).toBeTruthy();
  });

  it('renders the main component and first repository data initially', () => {
    render(<RepositoryContributionExplorer username="testuser" repos={mockRepos} />);
    expect(screen.getByText('Repository Contribution Explorer')).toBeTruthy();
    expect(screen.getByText('commitpulse')).toBeTruthy();
    expect(screen.getByText('A developer dashboard')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();

    // Check if stats are rendered
    expect(screen.getByText('150')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
  });

  it('handles selecting a different repository', () => {
    render(<RepositoryContributionExplorer username="testuser" repos={mockRepos} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } }); // Select second repo

    expect(screen.getByText('No description provided for this repository.')).toBeTruthy();
    expect(screen.getByText('Mixed')).toBeTruthy(); // Because primaryLanguage is null
    expect(screen.getByText('50')).toBeTruthy();
  });

  it('renders deep analytics (timeline and percentage)', () => {
    render(<RepositoryContributionExplorer username="testuser" repos={mockRepos} />);

    // Check that timeline events exist
    expect(screen.getByText('Initial Commit')).toBeTruthy();
    expect(screen.getByText('Major Architecture Refactor')).toBeTruthy();

    // Check that the percentage is rendered (as a number)
    // We expect some number between 40 and 100 based on the seed
    const percentageEl = screen.getByText(/Your Contribution Share/i);
    expect(percentageEl).toBeTruthy();
  });
});
