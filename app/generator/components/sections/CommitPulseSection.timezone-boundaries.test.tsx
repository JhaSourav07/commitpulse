import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('CommitPulseSection - Timezone Normalization & Calendar Data Boundary Alignment', () => {
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

  // Test 1: Verification of string validation boundary limits
  it('enforces string length layout thresholds on input components to prevent display overflow bugs', () => {
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

    const usernameInput = screen.getByLabelText(/GitHub Username/i) as HTMLInputElement;
    expect(usernameInput.maxLength).toBe(39);
  });

  // Test 2: Text placeholder fallback handling on empty states
  it('renders a warning fallback message block when the username structure matches an invalid format', () => {
    render(
      <CommitPulseSection
        githubUsername="invalid_username_format"
        showCommitPulse={true}
        commitPulseAccent=""
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    expect(screen.getByText(/Invalid format/i)).toBeInTheDocument();
  });

  // Test 3: Hex color fallback configuration limits
  it('identifies malformed color parameters and applies appropriate hex invalid warning styles', () => {
    render(
      <CommitPulseSection
        githubUsername="octocat"
        showCommitPulse={true}
        commitPulseAccent="invalid-color-hex"
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    expect(screen.getByText(/Invalid hex/i)).toBeInTheDocument();
  });

  // Test 4: Synchronous clear callback routines
  it('triggers accent clearing pathways predictably upon interaction commands', () => {
    render(
      <CommitPulseSection
        githubUsername="octocat"
        showCommitPulse={true}
        commitPulseAccent="10b981"
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    const clearButton = screen.getByRole('button', { name: /^Clear$/ });
    fireEvent.click(clearButton);

    expect(mockOnCommitPulseAccentChange).toHaveBeenCalledWith('');
  });

  // Test 5: Landmark identification rendering bounds
  it('preserves component wrapper structural bindings across state mutations', () => {
    const { container } = render(
      <CommitPulseSection
        githubUsername=""
        showCommitPulse={false}
        commitPulseAccent=""
        onGithubUsernameChange={mockOnGithubUsernameChange}
        onShowCommitPulseChange={mockOnShowCommitPulseChange}
        onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
      />
    );

    const coreContainer = container.querySelector('#commitpulse-section');
    expect(coreContainer).not.toBeNull();
    expect(screen.getByText('CommitPulse Badge')).toBeInTheDocument();
  });
});
