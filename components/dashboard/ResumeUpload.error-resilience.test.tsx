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

describe('ResumeUpload - Error Resilience', () => {
  const onParsed = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles invalid file types gracefully by calling onError and keeping file state null', () => {
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const invalidFile = new File(['dummy-content'], 'image.png', {
      type: 'image/png',
    });

    fireEvent.change(fileInput, {
      target: { files: [invalidFile] },
    });

    expect(onError).toHaveBeenCalledWith('Please upload a PDF or DOCX file.');
    expect(screen.queryByText('image.png')).not.toBeInTheDocument();
    // The screen-reader-visible instructions remain in the empty state
    expect(screen.getByText('Drop your resume here or click to browse')).toBeInTheDocument();
  });

  it('handles oversized files gracefully by calling onError and keeping file state null', () => {
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const oversizedFile = new File([new Uint8Array(6 * 1024 * 1024)], 'huge_resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [oversizedFile] },
    });

    expect(onError).toHaveBeenCalledWith('File size must be under 5MB.');
    expect(screen.queryByText('huge_resume.pdf')).not.toBeInTheDocument();
    // The screen-reader-visible instructions remain in the empty state
    expect(screen.getByText('Drop your resume here or click to browse')).toBeInTheDocument();
  });

  it('handles API response failures (success: false) by calling onError with custom error message and clearing file state', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Unsupported resume structure',
      }),
    }) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const file = new File(['pdf-content'], 'invalid_structure.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Unsupported resume structure');
    });

    // Verify the file state resets to null, showing the empty state instructions
    expect(screen.queryByText('invalid_structure.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('Drop your resume here or click to browse')).toBeInTheDocument();
  });

  it('handles non-ok API status (e.g. 500) with fallback message and clears file state', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
      }),
    }) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const file = new File(['pdf-content'], 'broken_server.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to upload resume.');
    });

    // File state should clear upon failure
    expect(screen.queryByText('broken_server.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('Drop your resume here or click to browse')).toBeInTheDocument();
  });

  it('handles network exceptions (fetch rejection) safely, resets isUploading, and recovers', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const file = new File(['pdf-content'], 'network_fail.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Network error. Please try again.');
    });

    // Verifies recovery flow: component is no longer uploading, name is cleared, empty state instruction is rendered
    expect(screen.queryByText('Parsing resume...')).not.toBeInTheDocument();
    expect(screen.queryByText('network_fail.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('Drop your resume here or click to browse')).toBeInTheDocument();
  });
});
