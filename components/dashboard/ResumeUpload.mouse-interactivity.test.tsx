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

describe('ResumeUpload - Mouse Interactivity', () => {
  const onParsed = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies cursor-pointer styling to the upload dropzone', () => {
    const { container } = render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const dropzone = container.querySelector('.border-dashed');

    expect(dropzone).toBeInTheDocument();
    expect(dropzone).toHaveClass('cursor-pointer');
  });

  it('opens file picker when upload dropzone is clicked', () => {
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');
    const clickSpy = vi.spyOn(fileInput, 'click');

    const dropzone = screen.getByRole('button');

    fireEvent.click(dropzone);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('applies active drag styling on drag enter and drag over', () => {
    const { container } = render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const dropzone = container.querySelector('.border-dashed');

    expect(dropzone).not.toHaveClass('border-emerald-500');

    fireEvent.dragEnter(dropzone!);
    fireEvent.dragOver(dropzone!);

    expect(dropzone).toHaveClass('border-emerald-500');
  });

  it('removes active drag styling on drag leave', () => {
    const { container } = render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const dropzone = container.querySelector('.border-dashed');

    fireEvent.dragEnter(dropzone!);

    expect(dropzone).toHaveClass('border-emerald-500');

    fireEvent.dragLeave(dropzone!);

    expect(dropzone).not.toHaveClass('border-emerald-500');
  });

  it('keeps upload interaction disabled while uploading', async () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})) as typeof fetch;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const fileInput = screen.getByLabelText('Upload resume');

    const file = new File(['pdf'], 'resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    const dropzone = screen.getByText('Parsing resume...').closest('.pointer-events-none');

    expect(dropzone).toBeInTheDocument();
  });
});
