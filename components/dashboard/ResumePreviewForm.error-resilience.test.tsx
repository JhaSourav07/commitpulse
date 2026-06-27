import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResumePreviewForm from './ResumePreviewForm';
import type { ReactNode, HTMLAttributes } from 'react';
import '@testing-library/jest-dom';

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastMocks.error,
    success: toastMocks.success,
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const parsed = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  skills: ['React'],
  education: [],
  experience: [],
};

describe('ResumePreviewForm - Error Resilience', () => {
  const onBack = vi.fn();
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles missing required fields gracefully', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={{
          ...parsed,
          name: '',
          email: '',
        }}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('Save Profile'));

    expect(toastMocks.error).toHaveBeenCalledWith('Name and email are required');

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('handles failed API responses with custom error message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Profile validation failed',
      }),
    }) as typeof fetch;

    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('Save Profile'));

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith('Profile validation failed');
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('handles non-ok API responses with fallback error message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
      }),
    }) as typeof fetch;

    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('Save Profile'));

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith('Failed to save profile');
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('handles network exceptions safely', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure')) as typeof fetch;

    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('Save Profile'));

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith('Network error. Please try again.');
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('recovers correctly after a failed request and allows successful retry', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      }) as typeof fetch;

    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('Save Profile'));

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith('Network error. Please try again.');
    });

    fireEvent.click(screen.getByText('Save Profile'));

    await waitFor(() => {
      expect(toastMocks.success).toHaveBeenCalledWith('Profile saved successfully!');
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
