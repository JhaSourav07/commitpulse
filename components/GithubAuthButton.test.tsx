import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubAuthButton } from './GithubAuthButton';

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  useSession: vi.fn(),
}));

import { useSession } from 'next-auth/react';

describe('GitHubAuthButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Sign in with GitHub" when there is no session', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    render(<GitHubAuthButton />);

    expect(screen.getByRole('button', { name: /sign in with github/i })).toBeInTheDocument();
  });

  it('renders "Sign out" when a session exists', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Nishu' }, expires: '9999' },
      status: 'authenticated',
      update: vi.fn(),
    });

    render(<GitHubAuthButton />);

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls signIn("github") when "Sign in with GitHub" is clicked', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    render(<GitHubAuthButton />);

    fireEvent.click(screen.getByRole('button', { name: /sign in with github/i }));

    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith('github');
  });

  it('calls signOut() when "Sign out" is clicked', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Nishu' }, expires: '9999' },
      status: 'authenticated',
      update: vi.fn(),
    });

    render(<GitHubAuthButton />);

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('does not render both buttons at the same time', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    render(<GitHubAuthButton />);

    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with github/i })).toBeInTheDocument();
  });
});
