import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { signIn } from 'next-auth/react';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing and displays header', () => {
    render(<LoginPage />);

    expect(screen.getByText('Welcome Back')).toBeTruthy();
    expect(
      screen.getByText('Log in to access your CommitPulse analytics and custom SVG themes')
    ).toBeTruthy();
  });

  it('renders input fields and GitHub sign in button', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Email or Username')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in with GitHub' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeTruthy();
  });

  it('toggles password visibility when eye icon is clicked', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: 'Show password' });
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    const hideToggleBtn = screen.getByRole('button', { name: 'Hide password' });
    fireEvent.click(hideToggleBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('displays validation errors when submitting empty form', async () => {
    render(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Email or Username is required')).toBeTruthy();
    expect(await screen.findByText('Password is required')).toBeTruthy();
  });

  it('calls signIn with github when GitHub button is clicked', () => {
    render(<LoginPage />);

    const githubBtn = screen.getByRole('button', { name: 'Sign in with GitHub' });
    fireEvent.click(githubBtn);

    expect(signIn).toHaveBeenCalledWith('github', { callbackUrl: '/' });
  });

  it('submits form successfully with valid credentials', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<LoginPage />);

    const identifierInput = screen.getByLabelText('Email or Username');
    const passwordInput = screen.getByLabelText('Password');
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });

    fireEvent.change(identifierInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    expect(await screen.findByText(/Successfully logged in/i)).toBeTruthy();
    fetchSpy.mockRestore();
  });

  it('contains navigation link to signup page', () => {
    render(<LoginPage />);

    const signupLink = screen.getByRole('link', { name: 'Sign Up' });
    expect(signupLink.getAttribute('href')).toBe('/signup');
  });
});
