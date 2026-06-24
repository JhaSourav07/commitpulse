import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { WallOfLove } from './WallOfLove';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    p: (props: React.ComponentProps<'p'>) => <p {...props} />,
  },
  useReducedMotion: () => true,
}));

// Mock gsap
vi.mock('gsap', () => {
  const timeline = () => ({
    to: vi.fn(),
    fromTo: vi.fn(),
    kill: vi.fn(),
  });

  return {
    default: {
      registerPlugin: vi.fn(),
      context: (cb: () => void) => {
        cb();
        return { revert: vi.fn() };
      },
      timeline,
      to: vi.fn(),
      set: vi.fn(),
    },
  };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

describe('WallOfLove', () => {
  it('renders section heading', () => {
    render(<WallOfLove />);

    const heading = screen.getByRole('heading', {
      level: 2,
    });

    expect(heading).toHaveTextContent('Wall');
    expect(heading).toHaveTextContent('Love');
  });

  it('renders testimonial author names', () => {
    render(<WallOfLove />);

    expect(screen.getAllByText('Alex Chen')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Priya Sharma')[0]).toBeInTheDocument();
    expect(screen.getAllByText('David Kim')[0]).toBeInTheDocument();
  });

  it('renders testimonial handles', () => {
    render(<WallOfLove />);

    expect(screen.getAllByText('@alexcodes')[0]).toBeInTheDocument();
    expect(screen.getAllByText('@priyabuilds')[0]).toBeInTheDocument();
    expect(screen.getAllByText('@davidkim')[0]).toBeInTheDocument();
  });

  it('renders testimonial avatars', () => {
    render(<WallOfLove />);

    const avatars = screen.getAllByAltText('Alex Chen');

    expect(avatars.length).toBeGreaterThan(0);
    expect(avatars[0]).toHaveAttribute('src');
  });

  it('renders stats section values', () => {
    render(<WallOfLove />);

    expect(screen.getByText('2K+')).toBeInTheDocument();
    expect(screen.getByText('50K+')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();

    expect(screen.getByText('Happy Developers')).toBeInTheDocument();
    expect(screen.getByText('Badges Generated')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
  });

  it('links the testimonial CTA to the review form route', () => {
    render(<WallOfLove />);

    expect(screen.getByRole('link', { name: /share your experience/i })).toHaveAttribute(
      'href',
      '/reviewform'
    );
  });
});
