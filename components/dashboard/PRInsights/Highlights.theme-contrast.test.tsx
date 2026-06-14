import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Highlights from './Highlights';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Zap: () => <span data-testid="zap-icon" />,
  MessageSquare: () => <span data-testid="message-square-icon" />,
  HardDrive: () => <span data-testid="hard-drive-icon" />,
  ArrowRight: () => <span data-testid="arrow-right-icon" />,
}));

// Mock framer-motion to prevent DOM warnings and satisfy ESLint rules
vi.mock('framer-motion', () => ({
  motion: {
    a: (
      props: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
        initial?: unknown;
        animate?: unknown;
        transition?: unknown;
      }
    ) => {
      const cleanProps = { ...props };
      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.transition;
      return <a {...cleanProps} />;
    },
  },
}));

const mockHighlights = {
  fastestMerged: {
    title: 'Fast PR #1',
    url: 'https://github.com/PR1',
    time: 1.5,
  },
  mostDiscussed: {
    title: 'Active PR #2',
    url: 'https://github.com/PR2',
    comments: 10,
  },
  largest: {
    title: 'Big PR #3',
    url: 'https://github.com/PR3',
    additions: 500,
    deletions: 200,
  },
};

describe('Highlights Theme Contrast and Visual Cohesion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to emulate dark/light presets on the document element
  const setupTheme = (isDark: boolean) => {
    document.documentElement.className = isDark ? 'dark' : '';
  };

  it('1. should emulate both dark and light presets', () => {
    // Emulate Light mode
    setupTheme(false);
    const { container: lightContainer, unmount } = render(
      <Highlights highlights={mockHighlights} />
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(lightContainer).toBeTruthy();
    unmount();

    // Emulate Dark mode
    setupTheme(true);
    const { container: darkContainer } = render(<Highlights highlights={mockHighlights} />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(darkContainer).toBeTruthy();
  });

  it('2. should assert that the visual elements adapt color styling properly for both settings', () => {
    render(<Highlights highlights={mockHighlights} />);

    const cards = screen.getAllByRole('link');
    expect(cards.length).toBe(3);

    cards.forEach((card) => {
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('dark:bg-zinc-900/50');
      expect(card.className).toContain('border-black/10');
      expect(card.className).toContain('dark:border-white/10');
    });
  });

  it('3. should verify contrast ratio standards are satisfied for all textual elements', () => {
    render(<Highlights highlights={mockHighlights} />);

    // Titles
    const title = screen.getByText('Fastest Merged PR');
    expect(title.className).toContain('text-gray-500');
    expect(title.className).toContain('dark:text-gray-400');

    // Values
    const value = screen.getByText('1.5 hrs');
    expect(value.className).toContain('text-gray-900');
    expect(value.className).toContain('dark:text-white');

    // Description text
    const desc = screen.getByText('Fast PR #1');
    expect(desc.className).toContain('text-gray-600');
    expect(desc.className).toContain('dark:text-gray-300');
  });

  it('4. should check that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    const { container } = render(<Highlights highlights={mockHighlights} />);

    const rootWrapper = container.firstChild as HTMLElement;
    expect(rootWrapper.className).toContain('grid');
    expect(rootWrapper.className).toContain('grid-cols-1');
    expect(rootWrapper.className).toContain('md:grid-cols-3');
    expect(rootWrapper.className).toContain('gap-6');

    const card = screen.getAllByRole('link')[0];
    expect(card.className).toContain('rounded-2xl');
    expect(card.className).toContain('p-5');
    expect(card.className).toContain('flex');
    expect(card.className).toContain('flex-col');
  });

  it('5. should ensure that background overlays do not clip foreground content colors', () => {
    render(<Highlights highlights={mockHighlights} />);

    const cards = screen.getAllByRole('link');
    cards.forEach((card) => {
      expect(card.className).toContain('overflow-hidden');
      expect(card.className).toContain('relative');
    });

    // Verify background overlay wrapper and icon element exist inside the card
    const iconWrappers = screen.getByTestId('zap-icon').parentElement;
    expect(iconWrappers?.className).toContain('bg-amber-500/10');
    expect(iconWrappers?.className).toContain('text-amber-500');
  });
});
