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

describe('WallOfLove - Timezone Boundaries', () => {
  it('Reduced Motion Boundary (UTC Equivalent): renders content when motion reduction is enabled', () => {
    render(<WallOfLove />);

    expect(screen.getByText('Happy Developers')).toBeInTheDocument();
    expect(screen.getByText('Badges Generated')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
  });

  it('Visual Alignment Boundary (Calendar Date Alignment Equivalent): preserves testimonial visibility across marquee boundaries', () => {
    render(<WallOfLove />);

    expect(screen.getAllByText('Alex Chen').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Priya Sharma').length).toBeGreaterThan(0);
    expect(screen.getAllByText('David Kim').length).toBeGreaterThan(0);
  });

  it('Stats Continuity Boundary (Leap Year Equivalent): renders all statistic values without gaps', () => {
    render(<WallOfLove />);

    expect(screen.getByText('2K+')).toBeInTheDocument();
    expect(screen.getByText('50K+')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
  });

  it('Avatar Mapping Boundary (Timezone Offset Equivalent): preserves avatar-to-author associations', () => {
    render(<WallOfLove />);

    const avatar = screen.getAllByAltText('Alex Chen')[0];

    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src');
    expect(avatar.getAttribute('src')).toContain('Alex');
  });

  it('Content Preservation Boundary (Calendar Grid Integrity Equivalent): preserves testimonial message content across render boundaries', () => {
    render(<WallOfLove />);

    const messages = screen.getAllByText(
      /Just added CommitPulse to my GitHub README and the 3D monolith looks absolutely insane/i
    );

    expect(messages.length).toBeGreaterThan(0);
  });
});
