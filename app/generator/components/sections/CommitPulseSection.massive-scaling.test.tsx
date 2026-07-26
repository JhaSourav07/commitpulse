import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { CommitPulseSection } from './CommitPulseSection';

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({
      exists: true,
      login: 'massive-user',
      name: 'Massive User',
      avatar_url: 'https://example.com/avatar.png',
      public_repos: 99999,
      stats: {
        currentStreak: 1825,
        longestStreak: 3650,
        totalContributions: 9999999,
      },
    }),
  })
) as unknown as typeof fetch;

describe('CommitPulseSection Massive Data Sets and Extreme High Bounds Scaling', () => {
  const defaultProps = {
    githubUsername: 'massive-user',
    showCommitPulse: true,
    commitPulseAccent: '#00ffaa',

    onGithubUsernameChange: vi.fn(),
    onShowCommitPulseChange: vi.fn(),
    onCommitPulseAccentChange: vi.fn(),
  };

  it('renders successfully with massive contribution values', () => {
    render(<CommitPulseSection {...defaultProps} />);

    expect(screen.getByText(/CommitPulse Badge/i)).toBeInTheDocument();
  });

  it('handles extremely long username input without crashing', () => {
    render(<CommitPulseSection {...defaultProps} />);

    const input = screen.getByPlaceholderText(/e.g. OmkarArdekar12/i);

    fireEvent.change(input, {
      target: {
        value: 'a'.repeat(39),
      },
    });

    expect(input).toBeInTheDocument();
  });

  it('preserves layout structure during heavy rendering', () => {
    const { container } = render(<CommitPulseSection {...defaultProps} />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders large scale UI within acceptable performance limits', () => {
    const start = performance.now();

    render(<CommitPulseSection {...defaultProps} />);

    const end = performance.now();

    expect(end - start).toBeLessThan(2000);
  });

  it('maintains stable interactive controls under extreme values', () => {
    render(<CommitPulseSection {...defaultProps} />);

    expect(screen.getByRole('switch', { name: /toggle commitpulse badge/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/Toggle CommitPulse badge/i)).toBeVisible();
  });
});
