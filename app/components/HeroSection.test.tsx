import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeroSection } from './HeroSection';

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    section: 'section',
    h1: 'h1',
    p: 'p',
  },
}));

describe('HeroSection', () => {
  it('renders the h1 heading', () => {
    render(<HeroSection />);

    const heading = screen.getByRole('heading', {
      level: 1,
    });

    expect(heading).toBeDefined();
  });

  it("heading contains 'Elevate Your'", () => {
    render(<HeroSection />);

    expect(screen.getByText(/Elevate Your/i)).toBeDefined();
  });

  it("heading contains 'Contribution Story'", () => {
    render(<HeroSection />);

    expect(screen.getByText(/Contribution Story/i)).toBeDefined();
  });

  it('renders the descriptive paragraph', () => {
    render(<HeroSection />);

    const paragraph = screen.getByText(/isometric/i);

    expect(paragraph).toBeDefined();
  });

  it("paragraph mentions 'isometric'", () => {
    render(<HeroSection />);

    expect(screen.getByText(/isometric/i).textContent).toMatch(/isometric/i);
  });
});
