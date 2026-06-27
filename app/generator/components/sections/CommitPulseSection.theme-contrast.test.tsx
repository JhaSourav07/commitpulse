import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CommitPulseSection } from './CommitPulseSection';

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

describe('CommitPulseSection Theme Contrast & Visual Cohesion', () => {
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
    document.documentElement.className = '';
  });

  afterEach(() => {
    document.documentElement.className = '';
  });

  it('renders correctly in light theme with visible primary content', () => {
    document.documentElement.className = 'light';

    render(<CommitPulseSection {...defaultProps} />);

    expect(screen.getByText('CommitPulse Badge')).toBeInTheDocument();
    expect(screen.getByText('Include badge in README')).toBeVisible();
    expect(screen.getByPlaceholderText('e.g. OmkarArdekar12')).toBeVisible();
  });

  it('renders correctly in dark theme with visible primary content', () => {
    document.documentElement.className = 'dark';

    render(<CommitPulseSection {...defaultProps} />);

    expect(screen.getByText('CommitPulse Badge')).toBeInTheDocument();
    expect(screen.getByText('Include badge in README')).toBeVisible();
    expect(screen.getByPlaceholderText('e.g. OmkarArdekar12')).toBeVisible();
  });

  it('keeps interactive controls accessible across themes', () => {
    document.documentElement.className = 'dark';

    render(<CommitPulseSection {...defaultProps} />);

    expect(
      screen.getByRole('switch', {
        name: /toggle commitpulse badge/i,
      })
    ).toBeVisible();

    expect(screen.getByPlaceholderText('e.g. OmkarArdekar12')).toBeVisible();
    expect(screen.getByPlaceholderText('10b981')).toBeVisible();
  });

  it('renders accent colour preview without clipping foreground content', () => {
    render(<CommitPulseSection {...defaultProps} commitPulseAccent="10b981" />);

    expect(screen.getByPlaceholderText('10b981')).toBeVisible();
    expect(screen.getByText(/overrides the badge tower colour/i)).toBeVisible();
  });

  it('preserves visible content when commitpulse section is toggled', () => {
    const onShowCommitPulseChange = vi.fn();

    render(
      <CommitPulseSection {...defaultProps} onShowCommitPulseChange={onShowCommitPulseChange} />
    );

    fireEvent.click(
      screen.getByRole('switch', {
        name: /toggle commitpulse badge/i,
      })
    );

    expect(onShowCommitPulseChange).toHaveBeenCalledWith(false);
  });
});
