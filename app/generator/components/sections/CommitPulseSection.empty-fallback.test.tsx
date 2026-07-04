import { render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CommitPulseSection } from './CommitPulseSection';

// Mock useDebounce so it fires synchronously
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt = '', src = '', ...props }: ComponentProps<'img'>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} {...props} />
  ),
}));

describe('CommitPulseSection - Edge Cases & Empty/Missing Inputs Verification', () => {
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
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it('renders successfully with empty parameters and handles missing properties defensively', () => {
    // Render with empty strings & default prop functions
    expect(() =>
      render(
        <CommitPulseSection
          {...defaultProps}
          githubUsername={undefined as unknown as string}
          commitPulseAccent={null as unknown as string}
        />
      )
    ).not.toThrow();

    // Verify it displays primary placeholders and structural texts
    expect(screen.getByText('CommitPulse Badge')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. OmkarArdekar12')).toHaveValue('');
    expect(screen.getByPlaceholderText('10b981')).toHaveValue('');
  });

  it('handles invalid github username structures and displays format warnings without calling fetch', async () => {
    render(<CommitPulseSection {...defaultProps} githubUsername="-invalid-name" />);

    // Warning message check
    expect(
      screen.getByText(/Invalid format — only letters, numbers and hyphens/i)
    ).toBeInTheDocument();

    // Verify fetch was not triggered
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('displays fallback user error notice when fetch resolves with a 404 not found status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'User not found' }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<CommitPulseSection {...defaultProps} githubUsername="non-existent-user" />);

    // Verify mock profile check text
    expect(screen.getByText(/Verifying GitHub profile/i)).toBeInTheDocument();

    // Wait for the response to resolve and verify fallback text
    await waitFor(() => {
      expect(
        screen.getByText('GitHub user not found. Check the spelling and try again.')
      ).toBeInTheDocument();
    });
  });

  it('handles network API exception rejections gracefully and sets fetchError message without crashing', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<CommitPulseSection {...defaultProps} githubUsername="octocat" />);

    await waitFor(() => {
      expect(screen.getByText('Verification failed: Connection timed out')).toBeInTheDocument();
    });
  });

  it('falls back to transparent preview background when accent color hex is invalid or empty', () => {
    const { container } = render(
      <CommitPulseSection {...defaultProps} commitPulseAccent="invalid-accent" />
    );

    // The accent color preview box should have a transparent color background style applied
    const previewBox = container.querySelector('div.w-8.h-8');
    expect(previewBox).toBeInTheDocument();
    expect(previewBox).toHaveStyle({ background: 'transparent' });
    expect(screen.getByText('Invalid hex')).toBeInTheDocument();
  });
});
