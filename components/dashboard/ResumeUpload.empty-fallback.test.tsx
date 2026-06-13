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

describe('ResumeUpload empty-fallback and edge-cases', () => {
  const onParsed = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the initial empty state with upload prompt text', () => {
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    expect(screen.getByText('Drop your resume here or click to browse')).toBeInTheDocument();
    expect(screen.getByText('PDF or DOCX · Max 5MB')).toBeInTheDocument();
    expect(screen.queryByText('Parsing resume...')).not.toBeInTheDocument();
  });

  it('handles empty files lists gracefully in file input change events', () => {
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');

    // Fire change event with an empty files list (simulating cancelled/empty selection)
    fireEvent.change(input, {
      target: { files: [] },
    });

    expect(onError).not.toHaveBeenCalled();
    expect(onParsed).not.toHaveBeenCalled();
  });

  it('handles null files gracefully in drop events', () => {
    const { container } = render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const dropzone = container.querySelector('.border-dashed');
    expect(dropzone).not.toBeNull();

    // Fire drop event with no files or null files in dataTransfer
    fireEvent.drop(dropzone!, {
      dataTransfer: { files: [] },
    });

    expect(onError).not.toHaveBeenCalled();
    expect(onParsed).not.toHaveBeenCalled();
  });

  it('falls back to default error message when API fails but error property is missing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
      }),
    }) as unknown as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');
    const file = new File(['pdf'], 'resume.pdf', { type: 'application/pdf' });

    fireEvent.change(input, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to upload resume.');
    });
  });

  it('handles network fetch rejection gracefully, resetting state and triggering error', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error('Network offline')) as unknown as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');
    const file = new File(['pdf'], 'resume.pdf', { type: 'application/pdf' });

    fireEvent.change(input, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Network error. Please try again.');
    });

    // Make sure we have recovered from loading back to empty state
    expect(screen.queryByText('Parsing resume...')).not.toBeInTheDocument();
    expect(screen.getByText('Drop your resume here or click to browse')).toBeInTheDocument();
  });

  it('handles drag enter, drag over, and drag leave events safely to update styling classes', () => {
    const { container } = render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const dropzone = container.querySelector('.border-dashed');
    expect(dropzone).not.toBeNull();

    // Fire dragenter and dragover events
    fireEvent.dragEnter(dropzone!);
    fireEvent.dragOver(dropzone!);

    // Style classes update should occur safely without throwing
    expect(dropzone).toHaveClass('border-emerald-500');

    // Fire dragleave
    fireEvent.dragLeave(dropzone!);
    expect(dropzone).not.toHaveClass('border-emerald-500');
  });
});
