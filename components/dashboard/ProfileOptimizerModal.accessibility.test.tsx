import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import ProfileOptimizerModal from './ProfileOptimizerModal';

type MockMotionProps = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockMotionProps) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: MockMotionProps) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const mockUserData = {
  profile: {
    developerScore: 70,
    bio: 'Developer',
    stats: {
      repositories: 10,
      followers: 20,
    },
  },
  languages: ['TS', 'JS'],
  stats: {
    totalContributions: 500,
  },
};

function renderModal() {
  return render(<ProfileOptimizerModal isOpen onClose={vi.fn()} userData={mockUserData} />);
}

describe('ProfileOptimizerModal accessibility', () => {
  it('renders the modal heading in a logical hierarchy', () => {
    renderModal();

    expect(
      screen.getByRole('heading', { name: /profile optimizer/i, level: 2 })
    ).toBeInTheDocument();
  });

  it('keeps actionable buttons available to assistive technologies', () => {
    renderModal();

    expect(screen.getByRole('button', { name: /copy text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download report/i })).toBeInTheDocument();
  });

  it('keeps disabled action states announced through native button semantics', () => {
    renderModal();

    expect(screen.getByRole('button', { name: /copy text/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /download report/i })).toBeDisabled();
  });

  it('keeps keyboard-focusable controls in normal document order', () => {
    const { container } = renderModal();

    const buttons = Array.from(container.querySelectorAll('button'));

    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveClass('absolute');
    expect(buttons[1]).toHaveTextContent(/copy text/i);
    expect(buttons[2]).toHaveTextContent(/download report/i);
  });

  it('renders accessible loading status text for screen readers', () => {
    renderModal();

    expect(screen.getByText(/analysing github profile/i)).toBeInTheDocument();
    expect(screen.getByText(/receive actionable improvements/i)).toBeInTheDocument();
  });
});
