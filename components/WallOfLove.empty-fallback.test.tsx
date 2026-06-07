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

describe('WallOfLove Empty & Fallback States', () => {
  it('renders without runtime errors', () => {
    expect(() => render(<WallOfLove />)).not.toThrow();
  });

  it('renders the statistics section', () => {
    render(<WallOfLove />);

    expect(screen.getByText('Happy Developers')).toBeInTheDocument();
    expect(screen.getByText('Badges Generated')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
  });

  it('shows stat values', () => {
    render(<WallOfLove />);

    expect(screen.getByText('2K+')).toBeInTheDocument();
    expect(screen.getByText('50K+')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
  });

  it('renders testimonial content safely', () => {
    render(<WallOfLove />);

    expect(screen.getAllByText(/Alex Chen/i).length).toBeGreaterThan(0);
  });

  it('renders community badge', () => {
    render(<WallOfLove />);

    expect(screen.getByText(/Loved by developers worldwide/i)).toBeInTheDocument();
  });
});
