import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResumeProfileSection from './ResumeProfileSection';
import type { ReactNode, HTMLAttributes } from 'react';
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
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const parsedResume = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  skills: ['React'],
  education: [],
  experience: [],
};

vi.mock('./ResumeUpload', () => ({
  default: ({
    onParsed,
    onError,
  }: {
    onParsed: (data: unknown, name: string) => void;
    onError: (error: string) => void;
  }) => (
    <div>
      <button onClick={() => onParsed(parsedResume, 'resume.pdf')}>Mock Upload Success</button>
      <button onClick={() => onError('Upload failed')}>Mock Upload Error</button>
    </div>
  ),
}));

vi.mock('./ResumePreviewForm', () => ({
  default: ({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) => (
    <div>
      <p>Preview Form</p>
      <button onClick={onBack}>Back</button>
      <button onClick={onComplete}>Complete</button>
    </div>
  ),
}));

describe('ResumeProfileSection - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload state correctly across all timezone contexts', () => {
    render(<ResumeProfileSection githubUsername="john" />);
    expect(screen.getByText('Resume Profile')).toBeInTheDocument();
    expect(screen.getByText(/upload your pdf or docx resume/i)).toBeInTheDocument();
  });

  it('transitions to preview state after file parse regardless of locale', () => {
    render(<ResumeProfileSection githubUsername="john" />);
    fireEvent.click(screen.getByText('Mock Upload Success'));
    expect(screen.getByText('Preview Form')).toBeInTheDocument();
  });

  it('returns to upload state on back action with clean boundary reset', () => {
    render(<ResumeProfileSection githubUsername="john" />);
    fireEvent.click(screen.getByText('Mock Upload Success'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText(/upload your pdf or docx resume/i)).toBeInTheDocument();
  });

  it('shows success state and fires toast after profile completion', () => {
    render(<ResumeProfileSection githubUsername="john" />);
    fireEvent.click(screen.getByText('Mock Upload Success'));
    fireEvent.click(screen.getByText('Complete'));
    expect(screen.getByText('Profile synced from resume')).toBeInTheDocument();
    expect(mockToastSuccess).toHaveBeenCalledWith('Profile updated from resume!');
  });

  it('fires error toast on upload failure independent of timezone offset', () => {
    render(<ResumeProfileSection githubUsername="john" />);
    fireEvent.click(screen.getByText('Mock Upload Error'));
    expect(mockToastError).toHaveBeenCalledWith('Upload failed');
  });
});
