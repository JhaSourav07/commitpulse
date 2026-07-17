import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

// Mock debouncing hook to bypass setTimeout lags instantly during runtime evaluations
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

// Mock local validation helper methods
vi.mock('@/lib/validations', () => ({
  validateGitHubUsername: (username: string) =>
    username.length > 0 && !username.includes('invalid'),
}));

describe('CommitPulseSection - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
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

  // Test 1: Full fluid layout scaling compliance
  it('implements global full-width fluid configurations on core input elements to prevent clipping', () => {
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
    expect(usernameInput).toHaveClass('w-full');
  });

  // Test 2: Multi-column grid distribution profiles
  it('implements responsive multi-column distributions inside the dashboard metrics section', async () => {
    const { container } = render(
      <CommitPulseSection
        githubUsername="octocat"
        showCommitPulse={true}
        commitPulseAccent=""
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('The Octocat')).toBeInTheDocument();
    });

    const statsGrid = container.querySelector('[class*="grid-cols-3"]');
    expect(statsGrid).not.toBeNull();
    expect(statsGrid).toHaveClass('grid');

    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('Longest Streak')).toBeInTheDocument();
    expect(screen.getByText('Contributions')).toBeInTheDocument();
  });

  // Test 3: Fluid image rendering width metrics
  it('enforces maximum boundary scaling restrictions on visual asset elements', async () => {
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

    const badgeImage = await screen.findByRole('img', { name: /CommitPulse badge for octocat/i });
    expect(badgeImage).toBeInTheDocument();
    expect(badgeImage).toHaveClass('w-full');
    expect(badgeImage).toHaveClass('max-w-[480px]');
  });

  // Test 4: Element spacing structural configurations
  it('implements structural gap spacing within form rows to prevent element collision layouts', () => {
    render(
      <CommitPulseSection
        githubUsername="" // Empty string bypasses the background async loop cleanly
        showCommitPulse={true}
        commitPulseAccent=""
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    const inputWrapper = screen.getByLabelText(/GitHub Username/i).closest('.relative');
    expect(inputWrapper).not.toBeNull();

    const formContainer = inputWrapper?.parentElement?.parentElement;
    expect(formContainer).toHaveClass('flex-col');
    expect(formContainer).toHaveClass('gap-4');
  });

  // Test 5: Accessible Interactive Controls
  it('maintains clear landmark interactivity rules on layout status control targets', () => {
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
    expect(toggleSwitch).toBeInTheDocument();
  });
});
