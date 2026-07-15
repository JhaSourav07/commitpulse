/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SubmitReviewPage from './reviewform';
import React from 'react';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children }: any) => <a>{children}</a>,
}));

describe('Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    // 1. Mock standard asynchronous imports and databases using stubs
    vi.spyOn(global, 'fetch').mockImplementation(vi.fn());
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(vi.fn());
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const fillValidForm = () => {
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Handle/i), { target: { value: '@johndoe' } });
    fireEvent.change(screen.getByPlaceholderText(/completely transformed/i), {
      target: { value: 'This is an amazingly long review for testing.' },
    });
  };

  it('tests service loading paths to ensure pending state overlays render', async () => {
    let resolveFetch: any;
    (global.fetch as any).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(<SubmitReviewPage />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Share My Testimonial/i }));

    // Button should show submitting state
    expect(await screen.findByText('Submitting...')).toBeInTheDocument();

    // Cleanup
    await act(async () => {
      resolveFetch({ ok: true, json: async () => ({ success: true, message: 'Success' }) });
    });

    await waitFor(() => {
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
    });
  });

  it('asserts local cache layers are queried before triggering database retrievals', async () => {
    (Storage.prototype.getItem as any).mockReturnValue(
      JSON.stringify({
        handle: '@johndoe',
        timestamp: Date.now(),
      })
    );

    render(<SubmitReviewPage />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Share My Testimonial/i }));

    expect(Storage.prototype.getItem).toHaveBeenCalledWith('last_review_submission');
    expect(
      await screen.findByText('Please wait before submitting another review.')
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('verifies correct fallback procedures during fake endpoint timeout blocks', async () => {
    (Storage.prototype.getItem as any).mockReturnValue(null);
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    render(<SubmitReviewPage />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Share My Testimonial/i }));

    // Verify correct fallback procedure
    expect(await screen.findByText(/Network error/i)).toBeInTheDocument();
  });

  it('asserts complete cache sync is written on success callbacks', async () => {
    (Storage.prototype.getItem as any).mockReturnValue(null);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Success' }),
    });

    render(<SubmitReviewPage />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Share My Testimonial/i }));

    await waitFor(() => {
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'last_review_submission',
        expect.stringContaining('"handle":"@johndoe"')
      );
    });

    // Check success screen
    expect(screen.getByText('Thank You!')).toBeInTheDocument();
  });

  it('handles server-side validation errors correctly', async () => {
    (Storage.prototype.getItem as any).mockReturnValue(null);
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, message: 'Server rejected data' }),
    });

    render(<SubmitReviewPage />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Share My Testimonial/i }));

    expect(await screen.findByText('Server rejected data')).toBeInTheDocument();
  });
});
