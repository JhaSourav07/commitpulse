import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResumeUpload from './ResumeUpload';

describe('ResumeUpload Theme Contrast', () => {
  const props = {
    onParsed: vi.fn(),
    onError: vi.fn(),
  };

  it('renders upload instructions with light and dark text classes', () => {
    render(<ResumeUpload {...props} />);

    const title = screen.getByText(/drop your resume here or click to browse/i);

    expect(title).toHaveClass('text-gray-700');
    expect(title).toHaveClass('dark:text-white/80');
  });

  it('renders helper text with light and dark contrast styles', () => {
    render(<ResumeUpload {...props} />);

    const helper = screen.getByText(/pdf or docx/i);

    expect(helper).toHaveClass('text-gray-500');
    expect(helper).toHaveClass('dark:text-white/50');
  });

  it('applies dark and light border styles to upload container', () => {
    const { container } = render(<ResumeUpload {...props} />);

    const dropzone = container.querySelector('.border-dashed');

    expect(dropzone).not.toBeNull();

    expect(dropzone).toHaveClass('border-black/10');
    expect(dropzone).toHaveClass('dark:border-[rgba(255,255,255,0.15)]');
  });

  it('applies dark mode hover background styling', () => {
    const { container } = render(<ResumeUpload {...props} />);

    const dropzone = container.querySelector('.border-dashed');

    expect(dropzone).not.toBeNull();

    expect(dropzone).toHaveClass('hover:bg-gray-50');
    expect(dropzone).toHaveClass('dark:hover:bg-white/5');
  });

  it('provides accessible file upload control with theme-safe styling', () => {
    render(<ResumeUpload {...props} />);

    expect(screen.getByLabelText(/upload resume/i)).toBeInTheDocument();
  });
});
