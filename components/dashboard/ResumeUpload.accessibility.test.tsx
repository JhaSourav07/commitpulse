import { render, screen, fireEvent } from '@testing-library/react';
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

describe('ResumeUpload - Accessibility compliance', () => {
  const onParsed = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the hidden file input with an accessible label and correct accept types', () => {
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    // File input must be queryable via its accessible name (aria-label)
    const fileInput = screen.getByLabelText('Upload resume');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.pdf,.docx');
  });

  it('displays descriptive, screen-reader-visible instruction text in the empty state', () => {
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    // Main instruction text should be present and legible to screen readers
    expect(screen.getByText('Drop your resume here or click to browse')).toBeInTheDocument();
    expect(screen.getByText('PDF or DOCX · Max 5MB')).toBeInTheDocument();
  });

  it('renders a remove button with an accessible label when a file is selected', async () => {
    // Mock successful fetch to allow transitioning to the file-selected state
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fileName: 'my_resume.pdf',
        data: { name: 'John Doe' },
      }),
    }) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const file = new File(['pdf-content'], 'my_resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    // The component should display the filename after uploading finishes
    const fileNameElement = await screen.findByText('my_resume.pdf');
    expect(fileNameElement).toBeInTheDocument();

    // Verify the remove button exists and has a descriptive accessible label
    const removeButton = screen.getByRole('button', { name: 'Remove file' });
    expect(removeButton).toBeInTheDocument();
  });

  it('clears the file and resets focus/state when the remove button is activated', async () => {
    // Mock successful fetch to allow transitioning to the file-selected state
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fileName: 'my_resume.pdf',
        data: { name: 'John Doe' },
      }),
    }) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const file = new File(['pdf-content'], 'my_resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    const removeButton = await screen.findByRole('button', { name: 'Remove file' });
    fireEvent.click(removeButton);

    // After removal, the file name should not be present anymore
    expect(screen.queryByText('my_resume.pdf')).not.toBeInTheDocument();
    // The screen-reader-visible empty state instructions should be restored
    expect(screen.getByText('Drop your resume here or click to browse')).toBeInTheDocument();
  });

  it('renders a screen-reader-visible message when parsing/uploading is in progress', async () => {
    // Keep upload pending
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const file = new File(['pdf-content'], 'my_resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    // Verify the parsing state is announced
    expect(screen.getByText('Parsing resume...')).toBeInTheDocument();
  });
});
