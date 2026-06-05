import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    context: vi.fn((cb) => {
      cb();
      return {
        revert: vi.fn(),
      };
    }),
    timeline: vi.fn(() => ({
      fromTo: vi.fn(),
      to: vi.fn(),
      kill: vi.fn(),
    })),
    set: vi.fn(),
    to: vi.fn(),
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));
import { WallOfLove } from './WallOfLove';
import '@testing-library/jest-dom/vitest';

describe('WallOfLove', () => {
  it('renders the Wall of Love heading', () => {
    render(<WallOfLove />);

    expect(screen.getByText(/Wall of/i)).toBeInTheDocument();
  });
  it('renders the developer feedback text', () => {
    render(<WallOfLove />);

    expect(
      screen.getByText(/See what developers are saying about CommitPulse/i)
    ).toBeInTheDocument();
  });
  it('renders the statistics section', () => {
    render(<WallOfLove />);

    expect(screen.getByText('Happy Developers')).toBeInTheDocument();
    expect(screen.getByText('Badges Generated')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
  });

  it('renders testimonial content', () => {
    render(<WallOfLove />);

    expect(screen.getAllByText(/Alex Chen/i).length).toBeGreaterThan(0);
  });

  it('renders the developer community badge', () => {
    render(<WallOfLove />);

    expect(screen.getByText(/Loved by developers worldwide/i)).toBeInTheDocument();
  });
});
