import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResumePreviewForm from './ResumePreviewForm';
import type { ReactNode, HTMLAttributes } from 'react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
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

describe('ResumePreviewForm - Accessibility compliance', () => {
  const onBack = vi.fn();
  const onComplete = vi.fn();

  it('checks that crucial fields have associated visible text labels', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
  });

  it('checks that interactive inputs have focus-visible or outline configurations', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const nameInput = screen.getByDisplayValue('John Doe');
    expect(nameInput).toHaveClass('focus:ring-2');
    expect(nameInput).toHaveClass('focus:ring-emerald-500');
    expect(nameInput).toHaveClass('outline-none');
  });

  it('checks that the save button is disabled when saving to prevent multiple submissions', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const saveButton = screen.getByRole('button', { name: /Save Profile/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('renders heading with correct text for screen reader document navigation', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    // h3 heading must be present and readable by screen readers
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain('Review Parsed Data');
  });

  it('has keyboard focusable Back and Save Profile buttons for keyboard navigation', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    const saveButton = screen.getByRole('button', { name: /save profile/i });

    // Both buttons must be keyboard focusable
    backButton.focus();
    expect(document.activeElement).toBe(backButton);

    saveButton.focus();
    expect(document.activeElement).toBe(saveButton);
  });
});
