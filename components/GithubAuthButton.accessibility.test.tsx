import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubAuthButton } from './GithubAuthButton';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(),
}));

import { useSession } from 'next-auth/react';

describe('GitHubAuthButton Accessibility Standards & ARIA Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a native <button> element — keyboard and screen reader accessible by default', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    render(<GitHubAuthButton />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('"Sign in with GitHub" button has accessible text for screen readers', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    render(<GitHubAuthButton />);

    expect(screen.getByRole('button', { name: /sign in with github/i })).toBeInTheDocument();
  });

  it('"Sign out" button has accessible text for screen readers', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Nishu' }, expires: '9999' },
      status: 'authenticated',
      update: vi.fn(),
    });

    render(<GitHubAuthButton />);

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('button is keyboard focusable when unauthenticated', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    render(<GitHubAuthButton />);

    const button = screen.getByRole('button');
    button.focus();

    expect(document.activeElement).toBe(button);
  });

  it('button is keyboard focusable when authenticated', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Nishu' }, expires: '9999' },
      status: 'authenticated',
      update: vi.fn(),
    });

    render(<GitHubAuthButton />);

    const button = screen.getByRole('button');
    button.focus();

    expect(document.activeElement).toBe(button);
  });

  it('renders exactly one button at a time — no duplicate controls', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    render(<GitHubAuthButton />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
