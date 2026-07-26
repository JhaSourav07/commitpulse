import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { HeroSection } from './HeroSection';

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
}));

describe('HeroSection — Accessibility & Screen Reader Compliance', () => {
  it('renders primary h1 heading with correct text for screen reader hierarchy', () => {
    render(<HeroSection />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Elevate Your Contribution Story.');
  });

  it('renders search landmark with descriptive aria-label for the input form', () => {
    render(<HeroSection />);

    const searchRegion = screen.getByRole('search', {
      name: 'Generate your GitHub streak badge',
    });
    expect(searchRegion).toBeInTheDocument();
  });

  it('renders username input with aria-label for screen reader announcement', () => {
    render(<HeroSection />);

    const input = screen.getByRole('textbox', { name: 'GitHub username' });
    expect(input).toBeInTheDocument();
  });

  it('renders both buttons with meaningful visible text for screen readers', () => {
    render(<HeroSection />);

    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /watch dashboard/i })).toBeInTheDocument();
  });

  it('hides decorative background elements from screen readers via aria-hidden', () => {
    const { container } = render(<HeroSection />);

    const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenElements.length).toBeGreaterThanOrEqual(2);
  });
});
