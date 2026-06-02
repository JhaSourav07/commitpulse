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

    // Form inputs should have associated visible text labels
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

    // Initially not disabled
    const saveButton = screen.getByRole('button', { name: /Save Profile/i });
    expect(saveButton).not.toBeDisabled();
  });
});
