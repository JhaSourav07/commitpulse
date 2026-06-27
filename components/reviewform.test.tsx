import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SubmitReviewPage from './reviewform';
import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    button: ({
      children,
      ...props
    }: ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }) => (
      <button {...props}>{children}</button>
    ),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('SubmitReviewPage', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
    vi.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(<SubmitReviewPage />);
    expect(screen.getByText('Loved CommitPulse?')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Handle (@username)')).toBeInTheDocument();
    expect(screen.getByText('Your Experience')).toBeInTheDocument();
    expect(screen.getByText(/Share My Testimonial/i)).toBeInTheDocument();
  });

  it('shows validation error for empty name', async () => {
    render(<SubmitReviewPage />);
    const form = screen.getByText('Full Name').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please enter your full name.')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid handle', async () => {
    render(<SubmitReviewPage />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText('Handle (@username)'), {
      target: { value: 'invalid handle!' },
    });

    const form = screen.getByText('Full Name').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText('Handle must be a valid username (letters, numbers, _ . -).')
      ).toBeInTheDocument();
    });
  });

  it('shows validation error for short message', async () => {
    render(<SubmitReviewPage />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText('Handle (@username)'), { target: { value: '@alex' } });
    fireEvent.change(screen.getByPlaceholderText(/CommitPulse completely transformed/i), {
      target: { value: 'short' },
    });

    const form = screen.getByText('Full Name').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Message must be at least 10 characters.')).toBeInTheDocument();
    });
  });

  it('submits successfully and shows success message', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Success' }),
    });

    render(<SubmitReviewPage />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText('Handle (@username)'), { target: { value: '@alex' } });
    fireEvent.change(screen.getByPlaceholderText(/CommitPulse completely transformed/i), {
      target: { value: 'This is a sufficiently long message to pass validation.' },
    });

    const form = screen.getByText('Full Name').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      expect(
        screen.getByText('Your testimonial has been received. It will be featured soon!')
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reviews',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alex',
          handle: '@alex',
          platform: 'twitter',
          message: 'This is a sufficiently long message to pass validation.',
          accentColor: '#10b981',
        }),
      })
    );
  });

  it('shows error message if API fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Server error occurred' }),
    });

    render(<SubmitReviewPage />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText('Handle (@username)'), { target: { value: '@alex' } });
    fireEvent.change(screen.getByPlaceholderText(/CommitPulse completely transformed/i), {
      target: { value: 'This is a sufficiently long message to pass validation.' },
    });

    const form = screen.getByText('Full Name').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Server error occurred')).toBeInTheDocument();
    });
  });
});
