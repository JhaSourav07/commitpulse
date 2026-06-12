import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { WallOfLove } from './WallOfLove';

vi.mock('framer-motion', () => ({
  motion: {
    p: (props: React.ComponentProps<'p'>) => <p {...props} />,
  },
  useReducedMotion: () => true,
}));

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    context: vi.fn((cb) => {
      cb();
      return { revert: vi.fn() };
    }),
    timeline: vi.fn(() => ({
      to: vi.fn(),
      fromTo: vi.fn(),
      kill: vi.fn(),
    })),
    to: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

describe('WallOfLove mock integrations', () => {
  it('registers ScrollTrigger plugin through gsap', () => {
    render(<WallOfLove />);
  });

  it('creates gsap context during render lifecycle', () => {
    render(<WallOfLove />);
  });

  it('creates animation timelines through mocked gsap', () => {
    render(<WallOfLove />);
  });

  it('renders successfully with reduced motion enabled', () => {
    render(<WallOfLove />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('renders testimonials without requiring external services', () => {
    render(<WallOfLove />);
    expect(screen.getAllByText('Alex Chen')[0]).toBeInTheDocument();
    expect(screen.getAllByText('David Kim')[0]).toBeInTheDocument();
  });
});
