import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { CommitPulseSection } from './CommitPulseSection';

// Mock debounce hook
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

// Mock username validation
vi.mock('@/lib/validations', () => ({
  validateGitHubUsername: () => true,
}));

// Mock next/image
vi.mock('next/image', () => ({
  /* eslint-disable @next/next/no-img-element */
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt="" {...props} />,
}));

describe('CommitPulseSection Accessibility Standards & Screen Reader Compliance', () => {
  const defaultProps = {
    githubUsername: '',
    showCommitPulse: true,
    commitPulseAccent: '',
    onGithubUsernameChange: vi.fn(),
    onShowCommitPulseChange: vi.fn(),
    onCommitPulseAccentChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Case 1
  it('Case 1: exposes the CommitPulse toggle as an accessible switch', () => {
    render(<CommitPulseSection {...defaultProps} />);

    const toggle = screen.getByRole('switch', {
      name: /toggle commitpulse badge/i,
    });

    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  // Case 2
  it('Case 2: GitHub username input remains keyboard accessible', () => {
    render(<CommitPulseSection {...defaultProps} />);

    const input = screen.getByPlaceholderText(/omkarardekar12/i);

    input.focus();

    expect(input).toHaveFocus();
  });

  // Case 3
  it('Case 3: clear username button exposes an accessible name', async () => {
    const user = userEvent.setup();

    render(<CommitPulseSection {...defaultProps} githubUsername="octocat" />);

    const clearButton = screen.getByRole('button', {
      name: /clear username/i,
    });

    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    await waitFor(() => {
      expect(defaultProps.onGithubUsernameChange).toHaveBeenCalled();
    });
  });

  // Case 4
  it('Case 4: accent colour input remains keyboard accessible', () => {
    render(<CommitPulseSection {...defaultProps} />);

    const accentInput = screen.getByPlaceholderText('10b981');

    accentInput.focus();

    expect(accentInput).toHaveFocus();
  });

  // Case 5
  it('Case 5: section heading hierarchy remains available to assistive technologies', () => {
    render(<CommitPulseSection {...defaultProps} />);

    expect(screen.getByText('CommitPulse Badge')).toBeInTheDocument();

    expect(screen.getByText(/include badge in readme/i)).toBeInTheDocument();
  });
});
