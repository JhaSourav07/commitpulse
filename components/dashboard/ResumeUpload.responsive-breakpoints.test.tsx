import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResumeUpload from './ResumeUpload';
import type { ReactNode, HTMLAttributes } from 'react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('ResumeUpload responsive breakpoints', () => {
  const onParsed = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
  });

  it('renders correctly on mobile viewport', () => {
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    expect(screen.getByLabelText('Upload resume')).toBeInTheDocument();
  });

  it('supports narrow mobile widths without crashing', () => {
    window.innerWidth = 320;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    expect(screen.getByLabelText('Upload resume')).toBeVisible();
  });

  it('renders upload interface on tablet viewport', () => {
    window.innerWidth = 768;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    expect(screen.getByLabelText('Upload resume')).toBeInTheDocument();
  });

  it('renders upload interface on desktop viewport', () => {
    window.innerWidth = 1280;

    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    expect(screen.getByLabelText('Upload resume')).toBeInTheDocument();
  });

  it('maintains accessible upload controls across breakpoints', () => {
    render(<ResumeUpload onParsed={onParsed} onError={onError} />);

    const input = screen.getByLabelText('Upload resume');

    expect(input).toHaveAttribute('type', 'file');
  });
});
