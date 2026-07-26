import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResumeProfileSection from './ResumeProfileSection';
import type { ReactNode, HTMLAttributes } from 'react';
import '@testing-library/jest-dom';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: HTMLAttributes<HTMLDivElement> & {
      children?: ReactNode;
    }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('./ResumeUpload', () => ({
  default: () => <div data-testid="resume-upload">Resume Upload</div>,
}));

vi.mock('./ResumePreviewForm', () => ({
  default: () => <div>Preview Form</div>,
}));

describe('ResumeProfileSection Empty/Fallback States', () => {
  it('renders successfully with empty github username', () => {
    render(<ResumeProfileSection githubUsername="" />);

    expect(screen.getByText('Resume Profile')).toBeInTheDocument();
  });

  it('shows upload section when username is empty', () => {
    render(<ResumeProfileSection githubUsername="" />);

    expect(screen.getByTestId('resume-upload')).toBeInTheDocument();
  });

  it('renders helper description text in default state', () => {
    render(<ResumeProfileSection githubUsername="" />);

    expect(screen.getByText(/upload your pdf or docx resume/i)).toBeInTheDocument();
  });

  it('maintains container structure in fallback state', () => {
    const { container } = render(<ResumeProfileSection githubUsername="" />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without runtime errors for missing input values', () => {
    expect(() => render(<ResumeProfileSection githubUsername="" />)).not.toThrow();
  });
});
