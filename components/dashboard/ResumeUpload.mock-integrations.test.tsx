import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResumeUpload from './ResumeUpload';
import type { ReactNode, HTMLAttributes } from 'react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('ResumeUpload - Asynchronous Mock Integrations', () => {
  const onParsed = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies that successful async upload transitions states correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fileName: 'async_resume.pdf',
        data: {
          name: 'Alice Developer',
          email: 'alice@example.com',
          skills: ['Vitest', 'React'],
        },
      }),
    }) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const file = new File(['mock-pdf'], 'async_resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    // Verify it transitions to success state and shows filename
    const fileText = await screen.findByText('async_resume.pdf');
    expect(fileText).toBeInTheDocument();
  });

  it('verifies that the correct callback payloads are sent upon successful parsing', async () => {
    const parsedData = {
      name: 'Bob Coder',
      email: 'bob@example.com',
      skills: ['TypeScript', 'Next.js'],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fileName: 'custom_bobs_resume.pdf',
        data: parsedData,
      }),
    }) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const file = new File(['mock-pdf'], 'bobs_resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onParsed).toHaveBeenCalledWith(parsedData, 'custom_bobs_resume.pdf');
    });
  });

  it('verifies that async API failure response triggers onError and resets state', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Parsing timeout or invalid structure',
      }),
    }) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const file = new File(['mock-pdf'], 'bobs_resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Parsing timeout or invalid structure');
    });

    // Component must clear the selected file and render instructions again
    expect(screen.queryByText('bobs_resume.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('Drop your resume here or click to browse')).toBeInTheDocument();
  });

  it('verifies that async fetch network rejection triggers fallback onError and resets state', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection abort'));

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const file = new File(['mock-pdf'], 'bobs_resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Network error. Please try again.');
    });

    // State reset check
    expect(screen.queryByText('bobs_resume.pdf')).not.toBeInTheDocument();
  });

  it('verifies that click event is locked during active upload requests', async () => {
    // Return a delayed promise that never resolves within the test synchronously
    let resolvePromise: (value: unknown) => void = () => {};
    const fetchPromise = new Promise<unknown>((resolve) => {
      resolvePromise = resolve;
    });

    global.fetch = vi.fn().mockReturnValue(fetchPromise);

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume') as HTMLInputElement;

    // Spy on the click event of the file input
    const clickSpy = vi.spyOn(fileInput, 'click');

    const file = new File(['mock-pdf'], 'bobs_resume.pdf', {
      type: 'application/pdf',
    });

    // Start upload
    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    // Verify it is in parsing/uploading state
    expect(screen.getByText('Parsing resume...')).toBeInTheDocument();

    // Now click the dropzone wrapper
    const dropzone = screen.getByText('Parsing resume...').closest('div');
    expect(dropzone).toBeInTheDocument();

    if (dropzone) {
      fireEvent.click(dropzone);
    }

    // Since isUploading is true, input click should not be triggered
    expect(clickSpy).not.toHaveBeenCalled();

    // Clean up
    await act(async () => {
      resolvePromise({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });
});
