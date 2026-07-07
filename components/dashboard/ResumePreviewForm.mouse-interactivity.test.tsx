import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResumePreviewForm from './ResumePreviewForm';
import type { ReactNode, HTMLAttributes } from 'react';
import '@testing-library/jest-dom';

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

const parsed = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  skills: ['React', 'TypeScript'],
  education: [],
  experience: [],
};

describe('ResumePreviewForm Mouse Interactivity', () => {
  const onBack = vi.fn();
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies hover class to back button on mouse enter', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const backBtn = screen.getByText('Back');
    expect(backBtn).toHaveClass('hover:bg-gray-50');

    fireEvent.mouseEnter(backBtn);
    expect(backBtn).toHaveClass('hover:bg-gray-50');

    fireEvent.mouseLeave(backBtn);
  });

  it('triggers onBack callback when back button is clicked', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('applies hover class to save button on mouse enter', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const saveBtn = screen.getByText('Save Profile');
    expect(saveBtn).toHaveClass('hover:bg-emerald-500');

    fireEvent.mouseEnter(saveBtn);
    expect(saveBtn).toHaveClass('hover:bg-emerald-500');
  });

  it('applies focus ring on input fields when focused', () => {
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

    nameInput.focus();
    expect(document.activeElement).toBe(nameInput);
  });

  it('adds skill input via add button click', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const addButtons = screen.getAllByText('Add');
    expect(addButtons.length).toBeGreaterThanOrEqual(1);

    const initialSkills = screen.getAllByDisplayValue(/React|TypeScript/);
    expect(initialSkills).toHaveLength(2);

    fireEvent.click(addButtons[0]);

    const skillInputs = screen
      .getAllByRole('textbox')
      .filter((el) => (el as HTMLInputElement).type === 'text');
    expect(skillInputs.length).toBeGreaterThanOrEqual(3);
  });
});
