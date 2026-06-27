import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode, HTMLAttributes } from 'react';
import ResumePreviewForm from './ResumePreviewForm';
import '@testing-library/jest-dom';

const { mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const defaultProps = {
  githubUsername: 'testuser',
  parsed: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    skills: ['React', 'TypeScript'],
    education: [
      { institution: 'MIT', degree: 'BTech', field: 'CSE', startDate: '2022', endDate: '2026' },
    ],
    experience: [
      {
        company: 'Google',
        role: 'Intern',
        startDate: '2024',
        endDate: '2024',
        description: 'Worked on X',
      },
    ],
  },
  fileName: 'resume.pdf',
  onBack: vi.fn(),
  onComplete: vi.fn(),
};

describe('ResumePreviewForm - TypeScript Compiler Validation & Schema Constraints Stability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all parsed fields correctly with valid prop schema', () => {
    render(<ResumePreviewForm {...defaultProps} />);
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('blocks save when required name field is empty', async () => {
    global.fetch = vi.fn();
    render(<ResumePreviewForm {...defaultProps} parsed={{ ...defaultProps.parsed, name: '' }} />);
    fireEvent.click(screen.getByText('Save Profile'));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Name and email are required');
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('accepts optional skill fields and adds new empty skill without compile error', () => {
    render(<ResumePreviewForm {...defaultProps} />);
    const addButtons = screen.getAllByText('Add');
    fireEvent.click(addButtons[0]);
    const inputs = screen.getAllByDisplayValue('');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('validates email as required field and blocks submission when empty', async () => {
    global.fetch = vi.fn();
    render(<ResumePreviewForm {...defaultProps} parsed={{ ...defaultProps.parsed, email: '' }} />);
    fireEvent.click(screen.getByText('Save Profile'));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Name and email are required');
    });
  });

  it('calls onBack when back button is clicked confirming prop callback type', () => {
    render(<ResumePreviewForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Back'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });
});
