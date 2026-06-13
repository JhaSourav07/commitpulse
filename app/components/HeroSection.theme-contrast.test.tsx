import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { HeroSection } from './HeroSection';

import type { ReactNode, HTMLAttributes } from 'react';

type MockMotionProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockMotionProps) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: MockMotionProps) => <p {...props}>{children}</p>,
  },
}));

vi.mock('lucide-react', () => ({
  Copy: () => <svg data-testid="copy-icon" />,
}));

describe('HeroSection Theme Contrast', () => {
  it('includes light and dark mode background gradient classes', () => {
    const { container } = render(<HeroSection />);

    const hero = container.querySelector('[role="region"]');

    expect(hero?.className).toContain('bg-[radial-gradient');
    expect(hero?.className).toContain('dark:bg-[radial-gradient');
  });

  it('includes light and dark mode text contrast classes', () => {
    render(<HeroSection />);

    const description = screen.getByText(/Stop settling for flat grids/i);

    expect(description.className).toContain('text-gray-600');
    expect(description.className).toContain('dark:text-white/65');
  });

  it('includes dark mode variants for contribution statistic badges', () => {
    render(<HeroSection />);

    expect(screen.getByText(/1,247 Contributions/i).className).toContain('dark:text-green-400');

    expect(screen.getByText(/83 Pull Requests/i).className).toContain('dark:text-cyan-400');

    expect(screen.getByText(/214 Commits/i).className).toContain('dark:text-purple-400');
  });

  it('includes light and dark theme classes on search form container', () => {
    const { container } = render(<HeroSection />);

    const searchRegion = container.querySelector('[role="search"]');

    expect(searchRegion?.className).toContain('bg-white/70');
    expect(searchRegion?.className).toContain('dark:bg-white/5');
    expect(searchRegion?.className).toContain('border-gray-200');
    expect(searchRegion?.className).toContain('dark:border-white/10');
  });

  it('includes dark mode classes on interactive controls', () => {
    render(<HeroSection />);

    const input = screen.getByLabelText('GitHub username');

    expect(input.className).toContain('text-gray-900');
    expect(input.className).toContain('dark:text-white');

    const copyButton = screen.getByRole('button', {
      name: /copy link/i,
    });

    expect(copyButton.className).toContain('dark:bg-white/10');
    expect(copyButton.className).toContain('dark:text-white');
  });
});
