import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeroSection } from './HeroSection';
import '@testing-library/jest-dom';

describe('HeroSection Responsive Breakpoints', () => {
  it('renders the hero heading with responsive text size classes (mobile default, larger at md breakpoint)', () => {
    const { container } = render(<HeroSection />);

    const heading = container.querySelector('h1')!;
    expect(heading).toHaveClass('text-5xl');
    expect(heading).toHaveClass('md:text-8xl');
  });

  it('stacks the search form vertically by default and switches to a horizontal row at the sm breakpoint', () => {
    render(<HeroSection />);

    const searchForm = screen.getByRole('search', { name: 'Generate your GitHub streak badge' });

    expect(searchForm).toHaveClass('flex');
    expect(searchForm).toHaveClass('flex-col');
    expect(searchForm).toHaveClass('sm:flex-row');
  });

  it('does not use fixed pixel widths anywhere that could cause horizontal overflow on narrow viewports', () => {
    const { container } = render(<HeroSection />);

    const allEls = container.querySelectorAll('[class]');
    allEls.forEach((el) => {
      const classes = el.getAttribute('class') || '';
      expect(classes).not.toMatch(/\bw-\[\d+px\]/);
      expect(classes).not.toMatch(/\bmin-w-\[\d+px\]/);
    });
  });

  it('renders the username input with a fluid full width instead of a fixed width', () => {
    render(<HeroSection />);

    const input = screen.getByLabelText('GitHub username');

    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('flex-1');
  });

  it('wraps contribution stat badges instead of overflowing horizontally on narrow viewports', () => {
    render(<HeroSection />);

    const badgesRow = screen.getByText('● 1,247 Contributions').parentElement;
    expect(badgesRow).toHaveClass('flex-wrap');
  });
});
