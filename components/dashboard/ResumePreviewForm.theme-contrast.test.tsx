import { render } from '@testing-library/react';
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

describe('ResumePreviewForm - Theme Contrast & Visual Cohesion', () => {
  const onBack = vi.fn();
  const onComplete = vi.fn();

  it('verifies dark and light background/border contrast classes on the outer container', () => {
    const { container } = render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const mainContainer = container.firstElementChild;
    expect(mainContainer).toHaveClass('bg-white');
    expect(mainContainer).toHaveClass('dark:bg-[#0a0a0a]');
    expect(mainContainer).toHaveClass('border-black/10');
    expect(mainContainer).toHaveClass('dark:border-[rgba(255,255,255,0.08)]');
  });

  it('verifies contrast text classes for headings, labels, and helper descriptions', () => {
    const { getByText } = render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const title = getByText('Review Parsed Data');
    expect(title).toHaveClass('text-gray-900');
    expect(title).toHaveClass('dark:text-white');

    const subtitle = getByText(/From: resume.pdf/);
    expect(subtitle).toHaveClass('text-gray-500');
    expect(subtitle).toHaveClass('dark:text-white/50');

    const nameLabel = getByText('Full Name');
    expect(nameLabel).toHaveClass('text-gray-600');
    expect(nameLabel).toHaveClass('dark:text-white/70');
  });

  it('verifies visual cohesion classes on input elements', () => {
    const { getByDisplayValue } = render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const nameInput = getByDisplayValue('John Doe');
    expect(nameInput).toHaveClass('bg-gray-50');
    expect(nameInput).toHaveClass('dark:bg-[#111]');
    expect(nameInput).toHaveClass('text-gray-900');
    expect(nameInput).toHaveClass('dark:text-white');
    expect(nameInput).toHaveClass('border-black/10');
    expect(nameInput).toHaveClass('dark:border-[rgba(255,255,255,0.1)]');
  });

  it('verifies button styles maintain cohesive contrast levels', () => {
    const { getByText, getAllByText } = render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const backButton = getByText('Back');
    expect(backButton).toHaveClass('border-black/10');
    expect(backButton).toHaveClass('dark:border-[rgba(255,255,255,0.15)]');
    expect(backButton).toHaveClass('text-gray-600');
    expect(backButton).toHaveClass('dark:text-white/70');

    const addSkillBtn = getAllByText('Add')[0];
    expect(addSkillBtn).toHaveClass('text-emerald-600');
    expect(addSkillBtn).toHaveClass('dark:text-emerald-400');
  });

  it('verifies save button maintains accessible contrast styling', () => {
    const { getByText } = render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const saveButton = getByText('Save Profile');

    expect(saveButton).toHaveClass('bg-emerald-600');
    expect(saveButton).toHaveClass('text-white');
  });
});
