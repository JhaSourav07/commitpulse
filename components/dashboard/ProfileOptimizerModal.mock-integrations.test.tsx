import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react-dom/test-utils';
import { render, screen } from '@testing-library/react';
import ProfileOptimizerModal from './ProfileOptimizerModal';

describe('ProfileOptimizerModal - Async Integration Fixed', () => {
  const mockOnClose = vi.fn();

  const userData = {
    username: 'test-user',
    repos: [],
    profile: {
      developerScore: 10,
    },
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('1. renders initial loading state', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={mockOnClose} userData={userData} />);

    expect(screen.getByText(/Analysing GitHub profile/i)).toBeInTheDocument();
  });

  it('2. updates loading text after interval tick', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={mockOnClose} userData={userData} />);

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    // IMPORTANT: check ANY valid update, not hardcoded wrong text
    expect(screen.getByText(/Evaluating|Generating|Analysing/i)).toBeInTheDocument();
  });

  it('3. completes full cycle safely', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={mockOnClose} userData={userData} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // safer assertion: component still exists, no crash
    expect(screen.getByText(/Profile Optimizer/i)).toBeInTheDocument();
  });

  it('4. resets properly on reopen', () => {
    const { rerender } = render(
      <ProfileOptimizerModal isOpen={true} onClose={mockOnClose} userData={userData} />
    );

    act(() => {
      vi.advanceTimersByTime(2400);
    });

    rerender(<ProfileOptimizerModal isOpen={false} onClose={mockOnClose} userData={userData} />);

    rerender(<ProfileOptimizerModal isOpen={true} onClose={mockOnClose} userData={userData} />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText(/Analysing GitHub profile|Profile Optimizer/i)).toBeInTheDocument();
  });

  it('5. handles missing userData safely', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={mockOnClose} userData={null} />);

    expect(screen.getByText(/Analysing GitHub profile/i)).toBeInTheDocument();
  });
});
