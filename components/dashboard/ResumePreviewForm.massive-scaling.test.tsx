import { render, screen } from '@testing-library/react';
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

const largeParsed = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  skills: Array.from({ length: 100 }, (_, index) => `Skill ${index}`),
  education: Array.from({ length: 25 }, (_, index) => ({
    institution: `Institution ${index}`,
    degree: `Degree ${index}`,
    field: `Field ${index}`,
    startDate: '2020',
    endDate: '2024',
  })),
  experience: Array.from({ length: 25 }, (_, index) => ({
    company: `Company ${index}`,
    role: `Role ${index}`,
    startDate: '2024',
    endDate: 'Present',
    description: `Description ${index}`,
  })),
};

describe('ResumePreviewForm massive scaling behavior', () => {
  const onBack = vi.fn();
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders safely with large parsed resume data', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={largeParsed}
        fileName="large-resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('Review Parsed Data')).toBeInTheDocument();
  });

  it('renders a large skills collection without crashing', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={largeParsed}
        fileName="large-resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    expect(screen.getByDisplayValue('Skill 0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Skill 99')).toBeInTheDocument();
  });

  it('renders large education entries without layout tree failures', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={largeParsed}
        fileName="large-resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    expect(screen.getByDisplayValue('Institution 0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Institution 24')).toBeInTheDocument();
  });

  it('renders large experience entries without layout tree failures', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={largeParsed}
        fileName="large-resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    expect(screen.getByDisplayValue('Company 0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Company 24')).toBeInTheDocument();
  });

  it('keeps primary actions available under high data volume', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={largeParsed}
        fileName="large-resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Save Profile')).toBeInTheDocument();
  });
});
