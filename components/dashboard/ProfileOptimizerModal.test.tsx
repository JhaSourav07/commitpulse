import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileOptimizerModal from './ProfileOptimizerModal';
import type { ReactNode, HTMLAttributes } from 'react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,

  motion: {
    div: ({
      children,
      ...props
    }: HTMLAttributes<HTMLDivElement> & {
      children?: ReactNode;
    }) => <div {...props}>{children}</div>,

    p: ({
      children,
      ...props
    }: HTMLAttributes<HTMLParagraphElement> & {
      children?: ReactNode;
    }) => <p {...props}>{children}</p>,
  },
}));

const mockUserData = {
  profile: {
    developerScore: 75,
    bio: 'Full Stack Developer',
    stats: {
      repositories: 12,
      followers: 20,
    },
  },
  languages: ['TypeScript', 'JavaScript'],
  stats: {
    totalContributions: 500,
  },
};

describe('ProfileOptimizerModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<ProfileOptimizerModal isOpen={false} onClose={onClose} userData={mockUserData} />);

    expect(screen.queryByText('Profile Optimizer')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    render(<ProfileOptimizerModal isOpen onClose={onClose} userData={mockUserData} />);

    expect(screen.getByText('Profile Optimizer')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ProfileOptimizerModal isOpen onClose={onClose} userData={mockUserData} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state initially', () => {
    render(<ProfileOptimizerModal isOpen onClose={onClose} userData={mockUserData} />);

    expect(screen.getByText('Analysing GitHub profile...')).toBeInTheDocument();
  });

  it('renders loading container when modal opens', () => {
    render(<ProfileOptimizerModal isOpen onClose={onClose} userData={mockUserData} />);

    expect(screen.getByText('Analysing GitHub profile...')).toBeInTheDocument();
  });
});
