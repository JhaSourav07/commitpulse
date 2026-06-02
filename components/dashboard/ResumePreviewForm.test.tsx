import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  skills: ['React'],
  education: [],
  experience: [],
};

describe('ResumePreviewForm', () => {
  const onBack = vi.fn();
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial parsed values', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    expect(screen.getByDisplayValue('John Doe')).toBeTruthy();
    expect(screen.getByDisplayValue('john@example.com')).toBeTruthy();
    expect(screen.getByDisplayValue('React')).toBeTruthy();
  });

  it('updates name, email, and phone fields', () => {
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
    const emailInput = screen.getByDisplayValue('john@example.com');
    fireEvent.change(nameInput, {
      target: { value: 'Jane Doe' },
    });

    fireEvent.change(emailInput, {
      target: { value: 'jane@example.com' },
    });

    expect((nameInput as HTMLInputElement).value).toBe('Jane Doe');
    expect((emailInput as HTMLInputElement).value).toBe('jane@example.com');
  });

  it('adds a new skill', () => {
    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getAllByText('Add')[0]);

    const skillInputs = screen.getAllByRole('textbox');
    expect(skillInputs.length).toBeGreaterThan(3);
  });

  it('does not submit when required fields are empty', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={{
          ...parsed,
          name: '',
          email: '',
        }}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('Save Profile'));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits successfully and calls onComplete', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
      }),
    }) as unknown as typeof fetch;

    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('Save Profile'));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
