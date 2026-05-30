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

describe('HeroSection responsive rendering and typography (Variation 3)', () => {
  it('renders full typography heading with high contrast gradient', () => {
    render(<HeroSection />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeDefined();
    expect(heading.className).toMatch(/text-5xl|text-8xl|font-extrabold/);
  });

  it('renders all three stat badges', () => {
    render(<HeroSection />);
    expect(screen.getByText(/1,247 Contributions/i)).toBeDefined();
    expect(screen.getByText(/83 Pull Requests/i)).toBeDefined();
    expect(screen.getByText(/214 Commits/i)).toBeDefined();
  });

  it('renders GitHub username input field', () => {
    render(<HeroSection />);
    const input = screen.getByPlaceholderText(/Enter GitHub Username/i);
    expect(input).toBeDefined();
  });

  it('renders Watch Dashboard button', () => {
    render(<HeroSection />);
    const button = screen.getByText(/Watch Dashboard/i);
    expect(button).toBeDefined();
  });

  it('renders Copy Link button', () => {
    render(<HeroSection />);
    const button = screen.getByText(/Copy Link/i);
    expect(button).toBeDefined();
  });

  it('renders descriptive paragraph with professional precision text', () => {
    render(<HeroSection />);
    expect(screen.getByText(/professional precision/i)).toBeDefined();
  });
});
