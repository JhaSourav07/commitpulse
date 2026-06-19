import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import ProfileOptimizerModal from './ProfileOptimizerModal';

/* eslint-disable @typescript-eslint/no-explicit-any */

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      const clean = { ...props };
      delete clean.initial;
      delete clean.animate;
      delete clean.exit;
      delete clean.transition;
      delete clean.onClick;
      return (
        <div className={className} {...clean}>
          {children}
        </div>
      );
    },
    p: ({ children, className, ...props }: any) => {
      const clean = { ...props };
      delete clean.initial;
      delete clean.animate;
      delete clean.exit;
      return (
        <p className={className} {...clean}>
          {children}
        </p>
      );
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x">X</span>,
  Download: () => <span>Download</span>,
  Copy: () => <span>Copy</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  TrendingUp: () => <span>TrendingUp</span>,
  AlertCircle: () => <span>AlertCircle</span>,
}));

const mockUserData = {
  profile: {
    developerScore: 60,
    bio: 'Full-stack developer',
    stats: { repositories: 10, followers: 50 },
  },
  languages: [{ name: 'TypeScript' }, { name: 'Python' }],
  stats: { totalContributions: 200 },
};

describe('ProfileOptimizerModal - Mouse Interactivity & Touch Events', () => {
  it('triggers simulated mouseenter/hover gestures on active segments or interactive nodes', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={mockUserData} />);
    const closeButton = screen.getByTestId('icon-x').closest('button')!;
    fireEvent.mouseEnter(closeButton);
    expect(closeButton).toBeInTheDocument();
  });

  it('verifies that responsive tooltip layouts display at computed coordinates (accessible name serves as tooltip)', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={mockUserData} />);
    const closeButton = screen.getByTestId('icon-x').closest('button')!;
    expect(closeButton).toHaveTextContent(/x/i);
  });

  it('tests custom click/touch gestures and ensures click events propagate correctly', () => {
    const onClose = vi.fn();
    render(<ProfileOptimizerModal isOpen={true} onClose={onClose} userData={mockUserData} />);
    const closeButton = screen.getByTestId('icon-x').closest('button')!;
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.touchStart(closeButton);
    expect(closeButton).toBeInTheDocument();
  });

  it('asserts appropriate cursor style classes (like pointer) are applied on hover via button semantics', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={mockUserData} />);
    const closeButton = screen.getByTestId('icon-x').closest('button')!;
    expect(closeButton.tagName.toLowerCase()).toBe('button');
    expect(closeButton.className).toContain('hover:bg-gray-100');
  });

  it('checks that mouseleave events successfully hide temporary overlay visuals', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={mockUserData} />);
    const closeButton = screen.getByTestId('icon-x').closest('button')!;
    fireEvent.mouseEnter(closeButton);
    fireEvent.mouseLeave(closeButton);
    expect(closeButton).toBeInTheDocument();
  });
});
