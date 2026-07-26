import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('ResumeUpload', () => {
  const onParsed = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error for invalid file type', () => {
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');

    const file = new File(['test'], 'image.png', {
      type: 'image/png',
    });

    fireEvent.change(input, {
      target: { files: [file] },
    });

    expect(onError).toHaveBeenCalledWith('Please upload a PDF or DOCX file.');
  });

  it('shows error when file exceeds 5MB', () => {
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');

    const file = new File([new Uint8Array(6 * 1024 * 1024)], 'resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(input, {
      target: { files: [file] },
    });

    expect(onError).toHaveBeenCalledWith('File size must be under 5MB.');
  });

  it('calls onParsed after successful upload', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fileName: 'resume.pdf',
        data: {
          name: 'John Doe',
        },
      }),
    }) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');

    const file = new File(['pdf'], 'resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(input, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onParsed).toHaveBeenCalled();
    });
  });

  it('shows loading state while uploading', async () => {
    global.fetch = vi.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  data: {},
                }),
              }),
            100
          )
        )
    ) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');

    const file = new File(['pdf'], 'resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(input, {
      target: { files: [file] },
    });

    expect(screen.getByText('Parsing resume...')).toBeInTheDocument();
  });

  it('shows upload error when API fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Upload failed',
      }),
    }) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');

    const file = new File(['pdf'], 'resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(input, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Upload failed');
    });
  });
});
