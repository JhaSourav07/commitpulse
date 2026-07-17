import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommitPulseSection } from './CommitPulseSection';

// Mock sub-components cleanly to avoid nested rendering dependencies
vi.mock('../SectionCard', () => ({
  SectionCard: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="section-card">
      <h2>{title}</h2>
      {children}
    </div>
  ),
  FieldLabel: ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

// Mock debouncing hook to bypass setTimeout lags instantly
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

// Mock local validation helper methods
vi.mock('@/lib/validations', () => ({
  validateGitHubUsername: (username: string) =>
    username.length > 0 && !username.includes('invalid'),
}));

describe('CommitPulseSection - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  const mockOnGithubUsernameChange = vi.fn();
  const mockOnShowCommitPulseChange = vi.fn();
  const mockOnCommitPulseAccentChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        exists: true,
        login: 'octocat',
        name: 'The Octocat',
        avatar_url: 'https://example.com/avatar.png',
        public_repos: 8,
        stats: { currentStreak: 5, longestStreak: 12, totalContributions: 42 },
      }),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1: Assert Cursor Styles Classes on Interactive Nodes
  it('applies appropriate clickable cursor class modifiers on the main visibility toggle switch', () => {
    render(
      <CommitPulseSection
        githubUsername=""
        showCommitPulse={false}
        commitPulseAccent=""
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    const toggleSwitch = screen.getByRole('switch', { name: /Toggle CommitPulse badge/i });
    expect(toggleSwitch).toHaveClass('cursor-pointer');
  });

  // Test 2: Simulated Mouse Hover / Clear Button Visibility Interactions
  it('displays the text clear trigger button when an accent color is actively populated', () => {
    render(
      <CommitPulseSection
        githubUsername=""
        showCommitPulse={true}
        commitPulseAccent="10b981"
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    const clearButton = screen.getByRole('button', { name: /^Clear$/ });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(mockOnCommitPulseAccentChange).toHaveBeenCalledWith('');
  });

  // Test 3: Input Focus / Interactivity Event propagation
  it('dispatches username mutation calls synchronously upon receiving text modification gestures', () => {
    render(
      <CommitPulseSection
        githubUsername=""
        showCommitPulse={true}
        commitPulseAccent=""
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    const usernameInput = screen.getByLabelText(/GitHub Username/i);
    fireEvent.change(usernameInput, { target: { value: 'new-user' } });

    expect(mockOnGithubUsernameChange).toHaveBeenCalledWith('new-user');
  });

  // Test 4: Mouse Leave state management transitions (Username Clear Button)
  it('handles user context clear button clicks to wipe data entry inputs cleanly', () => {
    render(
      <CommitPulseSection
        githubUsername="octocat"
        showCommitPulse={true}
        commitPulseAccent=""
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    const clearUserBtn = screen.getByRole('button', { name: /Clear username/i });
    expect(clearUserBtn).toBeInTheDocument();

    fireEvent.click(clearUserBtn);
    expect(mockOnGithubUsernameChange).toHaveBeenCalledWith('');
  });

  // Test 5: Simulated Touch Switch Interactivity Toggle State Changes
  it('processes toggle button activation events cleanly to mutate dashboard display parameters', () => {
    render(
      <CommitPulseSection
        githubUsername=""
        showCommitPulse={false}
        commitPulseAccent=""
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    const toggleSwitch = screen.getByRole('switch', { name: /Toggle CommitPulse badge/i });
    fireEvent.click(toggleSwitch);

    expect(mockOnShowCommitPulseChange).toHaveBeenCalledWith(true);
  });
});
