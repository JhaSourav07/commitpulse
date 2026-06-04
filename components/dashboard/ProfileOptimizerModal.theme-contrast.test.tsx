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

describe('ProfileOptimizerModal theme contrast', () => {
  it('renders light mode surface and foreground contrast classes', () => {
    const { container } = renderModal();

    expect(container.innerHTML).toContain('bg-white');
    expect(container.innerHTML).toContain('text-gray-900');
    expect(screen.getByText(/Profile Optimizer/i)).toBeInTheDocument();
  });

  it('renders dark mode surface and foreground contrast classes', () => {
    const { container } = renderModal();

    expect(container.innerHTML).toContain('dark:bg-[#0a0a0a]');
    expect(container.innerHTML).toContain('dark:text-white');
  });

  it('keeps backdrop overlay separate from modal foreground content', () => {
    const { container } = renderModal();

    const backdrop = container.querySelector('.bg-black\\/60');
    const modal = container.querySelector('.max-w-3xl');

    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveClass('backdrop-blur-md');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveClass('overflow-hidden');
  });

  it('keeps loading text readable in both themes', () => {
    const { container } = renderModal();

    expect(screen.getByText(/Analysing GitHub profile/i)).toBeInTheDocument();
    expect(container.innerHTML).toContain('text-gray-900');
    expect(container.innerHTML).toContain('dark:text-white');
  });

  it('keeps action buttons contrast-aware while disabled', () => {
    const { container } = renderModal();

    const copyButton = screen.getByRole('button', { name: /copy text/i });
    const downloadButton = screen.getByRole('button', { name: /download report/i });

    expect(copyButton).toHaveClass('bg-white');
    expect(copyButton).toHaveClass('dark:bg-[#111]');
    expect(copyButton).toHaveClass('text-gray-900');
    expect(copyButton).toHaveClass('dark:text-white');

    expect(downloadButton).toHaveClass('bg-black');
    expect(downloadButton).toHaveClass('dark:bg-white');
    expect(downloadButton).toHaveClass('text-white');
    expect(downloadButton).toHaveClass('dark:text-black');

    expect(container.innerHTML).not.toContain('text-transparent');
  });
});
