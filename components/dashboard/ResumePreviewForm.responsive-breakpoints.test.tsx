import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResumePreviewForm from './ResumePreviewForm';
import '@testing-library/jest-dom';
import type { ReactNode, HTMLAttributes } from 'react';

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

const defaultProps = {
  githubUsername: 'john',
  parsed,
  fileName: 'resume.pdf',
  onBack: vi.fn(),
  onComplete: vi.fn(),
};

describe('ResumePreviewForm Responsive Breakpoints', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    window.dispatchEvent(new Event('resize'));
  });

  it('renders correctly on mobile viewport', () => {
    render(<ResumePreviewForm {...defaultProps} />);

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('allows adding skills on mobile viewport', () => {
    render(<ResumePreviewForm {...defaultProps} />);

    fireEvent.click(screen.getAllByText('Add')[0]);

    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes.length).toBeGreaterThan(3);
  });

  it('allows adding education entries on mobile viewport', () => {
    render(<ResumePreviewForm {...defaultProps} />);

    fireEvent.click(screen.getAllByText('Add')[1]);

    expect(screen.getByPlaceholderText('Institution')).toBeInTheDocument();
  });

  it('allows adding experience entries on mobile viewport', () => {
    render(<ResumePreviewForm {...defaultProps} />);

    fireEvent.click(screen.getAllByText('Add')[2]);

    expect(screen.getByPlaceholderText('Company')).toBeInTheDocument();
  });

  it('shows navigation buttons on small screens', () => {
    render(<ResumePreviewForm {...defaultProps} />);

    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Save Profile')).toBeInTheDocument();
  });
});
