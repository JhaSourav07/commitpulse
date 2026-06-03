import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode, HTMLAttributes } from 'react';
import '@testing-library/jest-dom';

import ResumePreviewForm from './ResumePreviewForm';

const mocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: mocks.error,
    success: mocks.success,
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const emptyParsed = {
  name: '',
  email: '',
  phone: '',
  skills: [],
  education: [],
  experience: [],
};

describe('ResumePreviewForm empty fallback behavior', () => {
  const onBack = vi.fn();
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders safely with empty parsed resume values', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={emptyParsed}
        fileName="empty.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('Review Parsed Data')).toBeInTheDocument();
  });

  it('shows empty fallback input fields for missing profile values', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={emptyParsed}
        fileName="empty.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const inputs = screen.getAllByRole('textbox');

    expect(inputs[0]).toHaveValue('');
    expect(inputs[1]).toHaveValue('');
  });

  it('does not crash when skills array is empty', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={emptyParsed}
        fileName="empty.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText(/skills/i)).toBeInTheDocument();
  });

  it('prevents submission when required fallback fields are empty', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={emptyParsed}
        fileName="empty.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('Save Profile'));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('allows user to add a skill from an empty fallback state', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={emptyParsed}
        fileName="empty.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getAllByText('Add')[0]);

    expect(screen.getByText('Skills')).toBeInTheDocument();
  });
});
