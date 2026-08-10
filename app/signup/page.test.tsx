import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUpPage from './page';
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

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing and displays title', () => {
    render(<SignUpPage />);

    expect(screen.getByText('Create Your Account')).toBeTruthy();
  });

  it('renders all required form fields and GitHub signup button', () => {
    render(<SignUpPage />);

    expect(screen.getByLabelText('Full Name')).toBeTruthy();
    expect(screen.getByLabelText('Email Address')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByLabelText('Confirm Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign up with GitHub' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Create Account$/i })).toBeTruthy();
  });

  it('displays real-time password strength indicators when password is typed', () => {
    render(<SignUpPage />);

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ssw0rd' } });

    expect(screen.getByText('Password Strength:')).toBeTruthy();
    expect(screen.getByText('Strong')).toBeTruthy();
    expect(screen.getByText('At least 8 characters')).toBeTruthy();
  });

  it('shows error if password and confirm password do not match', async () => {
    render(<SignUpPage />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitBtn = screen.getByRole('button', { name: /^Create Account$/i });

    fireEvent.change(nameInput, { target: { value: 'Alex' } });
    fireEvent.change(emailInput, { target: { value: 'alex@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ss1' } });
    fireEvent.change(confirmInput, { target: { value: 'MismatchP@ss2' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Passwords do not match')).toBeTruthy();
  });

  it('calls signIn with github when GitHub signup button is clicked', () => {
    render(<SignUpPage />);

    const githubBtn = screen.getByRole('button', { name: 'Sign up with GitHub' });
    fireEvent.click(githubBtn);

    expect(signIn).toHaveBeenCalledWith('github', { callbackUrl: '/' });
  });

  it('submits form successfully with valid input', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<SignUpPage />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Alex Smith' } });
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'alex@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongP@ssw0rd' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'StrongP@ssw0rd' },
    });
    fireEvent.click(screen.getByLabelText(/I agree to the/i));

    fireEvent.click(screen.getByRole('button', { name: /^Create Account$/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/auth/signup',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    expect(await screen.findByText('Account created successfully!')).toBeTruthy();
    fetchSpy.mockRestore();
  });

  it('contains navigation link back to login page', () => {
    render(<SignUpPage />);

    const loginLink = screen.getByRole('link', { name: 'Log In' });
    expect(loginLink.getAttribute('href')).toBe('/login');
  });
});
