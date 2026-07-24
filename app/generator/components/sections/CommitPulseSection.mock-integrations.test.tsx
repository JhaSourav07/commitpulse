import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommitPulseSection } from './CommitPulseSection';

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

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

vi.mock('@/lib/validations', () => ({
  validateGitHubUsername: (username: string) =>
    username.length > 0 && !username.includes('invalid'),
}));

describe('CommitPulseSection - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  const mockOnGithubUsernameChange = vi.fn();
  const mockOnShowCommitPulseChange = vi.fn();
  const mockOnCommitPulseAccentChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1: Active Async Lookup Path (Service Loading Paths)
  it('handles successful profile verification queries from the api route cleanly', async () => {
    const mockUserData = {
      exists: true,
      login: 'octocat',
      name: 'The Octocat',
      avatar_url: 'https://example.com/avatar.png',
      public_repos: 8,
      stats: { currentStreak: 5, longestStreak: 12, totalContributions: 42 },
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData,
    } as Response);

    render(
      <CommitPulseSection
        githubUsername="octocat"
        showCommitPulse={true}
        commitPulseAccent="#00ffcc"
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    // Verify loading overlay rendering displays immediately
    expect(screen.getByText(/Verifying GitHub profile/i)).toBeInTheDocument();

    // Wait for async payload mapping to complete successfully
    await waitFor(() => {
      expect(screen.getByText('The Octocat')).toBeInTheDocument();
      expect(screen.getByText('@octocat')).toBeInTheDocument();
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      expect(screen.getByText('Longest Streak')).toBeInTheDocument();
      expect(screen.getByText('Contributions')).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/user-details?username=octocat');
  });

  // Test 2: Local Setup Missing Cache / Token Notice Procedures
  it('gracefully renders descriptive notice banners when local environment tokens are unassigned', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(
      new Error('token is missing in local configuration environment')
    );

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

    await waitFor(() => {
      expect(screen.getByText(/Local Setup Notice:/i)).toBeInTheDocument();
      // Swapped out getByText for getAllByText to successfully parse the multiple token node listings inside the DOM layout block
      expect(screen.getAllByText(/GITHUB_TOKEN/i).length).toBeGreaterThan(0);
    });
  });

  // Test 3: Endpoint Fallback Procedures on 404 User Not Found Responses
  it('triggers error routing message blocks when endpoint searches return non-existent profile errors', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'User not found' }),
    } as Response);

    render(
      <CommitPulseSection
        githubUsername="ghostuser123" // Safe username that bypasses custom verification constraints
        showCommitPulse={true}
        commitPulseAccent=""
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/GitHub user not found. Check the spelling and try again./i)
      ).toBeInTheDocument();
    });
  });

  // Test 4: Custom Toggle State Interactivity Mutations
  it('dispatches status synchronization callbacks on click interaction triggers', () => {
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

    const toggleButton = screen.getByRole('switch');
    fireEvent.click(toggleButton);

    expect(mockOnShowCommitPulseChange).toHaveBeenCalledWith(true);
  });

  // Test 5: Dynamic Parameter Color Swatch Sync Configuration
  it('manages value truncation boundaries on hex accent inputs and triggers clear routines safely', () => {
    render(
      <CommitPulseSection
        githubUsername="octocat"
        showCommitPulse={true}
        commitPulseAccent="#10b981"
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    const accentInput = screen.getByLabelText(/Accent Colour/i) as HTMLInputElement;
    expect(accentInput.value).toBe('10b981');

    fireEvent.change(accentInput, { target: { value: '00ff55' } });
    expect(mockOnCommitPulseAccentChange).toHaveBeenCalledWith('00ff55');
  });
});
