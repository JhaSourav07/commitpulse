import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WallOfLove } from './WallOfLove';
import type { ReactNode } from 'react';

vi.mock('gsap', () => {
  const mockGsap = {
    registerPlugin: vi.fn(),
    set: vi.fn(),
    to: vi.fn(() => ({ kill: vi.fn() })),
    timeline: vi.fn(() => ({
      fromTo: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    })),
    context: vi.fn(() => ({
      revert: vi.fn(),
    })),
  };

  return {
    default: mockGsap,
    gsap: mockGsap,
  };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    p: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  },
  useReducedMotion: () => false,
}));

describe('WallOfLove Theme Contrast', () => {
  it('renders Wall Of Love heading', () => {
    render(<WallOfLove />);

    expect(screen.getByText(/Wall of/i)).toBeDefined();
  });

  it('renders developer feedback text', () => {
    render(<WallOfLove />);

    expect(screen.getByText(/See what developers are saying about CommitPulse/i)).toBeDefined();
  });

  it('renders statistics section', () => {
    render(<WallOfLove />);

    expect(screen.getByText('Happy Developers')).toBeDefined();
    expect(screen.getByText('Badges Generated')).toBeDefined();
    expect(screen.getByText('Average Rating')).toBeDefined();
  });

  it('renders dark mode classes', () => {
    const { container } = render(<WallOfLove />);

    expect(container.innerHTML).toContain('dark:');
  });

  it('renders testimonial cards', () => {
    render(<WallOfLove />);

    expect(screen.getAllByText(/Alex Chen/i).length).toBeGreaterThan(0);
  });
});
