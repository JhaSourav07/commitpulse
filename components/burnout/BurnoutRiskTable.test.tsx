import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BurnoutRiskTable from './BurnoutRiskTable';

const mockContributors = [
  {
    username: 'alice',
    avatarUrl: 'https://github.com/alice.png',
    totalCommits: 500,
    commitShare: 50,
    burnoutScore: 85,
    riskLevel: 'High' as const,
    activeWeeks: 12,
    highIntensityWeeks: 6,
    consecutiveHighWeeks: 4,
    restWeeks: 0,
    recentTrend: [10, 20, 30],
  },
  {
    username: 'bob',
    avatarUrl: 'https://github.com/bob.png',
    totalCommits: 300,
    commitShare: 30,
    burnoutScore: 60,
    riskLevel: 'Medium' as const,
    activeWeeks: 8,
    highIntensityWeeks: 2,
    consecutiveHighWeeks: 1,
    restWeeks: 2,
    recentTrend: [5, 10, 15],
  },
  {
    username: 'charlie',
    avatarUrl: 'https://github.com/charlie.png',
    totalCommits: 200,
    commitShare: 20,
    burnoutScore: 20,
    riskLevel: 'Low' as const,
    activeWeeks: 4,
    highIntensityWeeks: 0,
    consecutiveHighWeeks: 0,
    restWeeks: 6,
    recentTrend: [2, 4, 6],
  },
];

describe('BurnoutRiskTable Live Search & Column Sorting', () => {
  beforeEach(() => {
    // cleanup
  });

  it('renders all contributors initially', () => {
    render(<BurnoutRiskTable contributors={mockContributors} />);
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
    expect(screen.getByText('@charlie')).toBeInTheDocument();
    expect(screen.getByText(/Showing 3 of 3/i)).toBeInTheDocument();
  });

  it('filters contributors dynamically by search query', () => {
    render(<BurnoutRiskTable contributors={mockContributors} />);
    const searchInput = screen.getByPlaceholderText(/search contributor/i);

    fireEvent.change(searchInput, { target: { value: 'bob' } });

    expect(screen.getByText('@bob')).toBeInTheDocument();
    expect(screen.queryByText('@alice')).not.toBeInTheDocument();
    expect(screen.queryByText('@charlie')).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 1 of 3/i)).toBeInTheDocument();
  });

  it('filters contributors to high risk only when toggle is enabled', () => {
    render(<BurnoutRiskTable contributors={mockContributors} />);
    const toggleBtn = screen.getByRole('button', { name: /high risk only/i });

    fireEvent.click(toggleBtn);

    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.queryByText('@bob')).not.toBeInTheDocument();
    expect(screen.queryByText('@charlie')).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 1 of 3/i)).toBeInTheDocument();
  });

  it('sorts contributors by username when Contributor header is clicked', () => {
    render(<BurnoutRiskTable contributors={mockContributors} />);
    const contributorHeaderBtn = screen.getByRole('button', { name: /contributor/i });

    // Initial default sort is burnoutScore desc (alice, bob, charlie)
    fireEvent.click(contributorHeaderBtn); // Sort by username desc (charlie, bob, alice)

    const namesDesc = screen.getAllByText(/@(alice|bob|charlie)/i).map((el) => el.textContent);
    expect(namesDesc).toEqual(['@charlie', '@bob', '@alice']);

    fireEvent.click(contributorHeaderBtn); // Toggle to asc (alice, bob, charlie)
    const namesAsc = screen.getAllByText(/@(alice|bob|charlie)/i).map((el) => el.textContent);
    expect(namesAsc).toEqual(['@alice', '@bob', '@charlie']);
  });

  it('shows empty state and resets filters when Reset Filters button is clicked', () => {
    render(<BurnoutRiskTable contributors={mockContributors} />);
    const searchInput = screen.getByPlaceholderText(/search contributor/i);

    fireEvent.change(searchInput, { target: { value: 'nonexistent_user' } });

    expect(screen.getByText(/No contributors match your filters/i)).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /reset filters/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
    expect(screen.getByText('@charlie')).toBeInTheDocument();
  });
});
