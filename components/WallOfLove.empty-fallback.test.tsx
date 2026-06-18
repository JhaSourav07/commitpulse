import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    context: vi.fn((cb) => {
      cb();
      return { revert: vi.fn() };
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

vi.mock('framer-motion', () => ({
  motion: {
    p: (props: React.ComponentProps<'p'>) => <p {...props} />,
    div: (props: React.ComponentProps<'div'>) => <div {...props} />,
    span: (props: React.ComponentProps<'span'>) => <span {...props} />,
  },
  useReducedMotion: () => true,
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));

import { WallOfLove } from './WallOfLove';
import '@testing-library/jest-dom/vitest';

describe('WallOfLove Empty / Missing Inputs Verification', () => {
  it('renders the Wall of Love heading without external data dependencies', () => {
    render(<WallOfLove />);
    expect(screen.getByRole('heading', { level: 2, name: /wall.*love/i })).toBeInTheDocument();
  });

  it('renders the developer feedback section text', () => {
    render(<WallOfLove />);
    expect(
      screen.getByText(/See what developers are saying about CommitPulse/i)
    ).toBeInTheDocument();
  });

  it('renders the statistics section with hardcoded fallback values', () => {
    render(<WallOfLove />);
    expect(screen.getByText('Happy Developers')).toBeInTheDocument();
    expect(screen.getByText('Badges Generated')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
  });

  it('renders testimonial content from internal hardcoded data', () => {
    render(<WallOfLove />);
    expect(screen.getAllByText(/Alex Chen/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Priya Sharma/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Marcus Johnson/i).length).toBeGreaterThan(0);
  });

  it('renders the developer community badge CTA', () => {
    render(<WallOfLove />);
    expect(screen.getByText(/Loved by developers worldwide/i)).toBeInTheDocument();
  });

  it('renders without GSAP ScrollTrigger registration errors', () => {
    render(<WallOfLove />);
    expect(screen.getByText(/Loved by developers worldwide/i)).toBeInTheDocument();
  });

  it('renders all stat items from the internal data set', () => {
    render(<WallOfLove />);
    const stats = screen.getAllByText(/\d[\d,.]*/);
    expect(stats.length).toBeGreaterThanOrEqual(3);
  });

  it('renders testimonial cards with platform indicators', () => {
    render(<WallOfLove />);
    expect(screen.getAllByText(/@alexcodes/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/@priyabuilds/i).length).toBeGreaterThan(0);
  });
});
