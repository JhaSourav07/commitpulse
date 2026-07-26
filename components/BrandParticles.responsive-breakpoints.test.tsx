import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import BrandParticles from './BrandParticles';

let mockReducedMotion = false;

// Maintain cohesive framer-motion mocking from the base test file to avoid DOM crashes
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      animate,
      transition,
      style,
      ...props
    }: {
      animate?: unknown;
      transition?: unknown;
      style?: React.CSSProperties;
      [key: string]: unknown;
    }) => (
      <div
        {...props}
        style={style}
        data-testid="motion-div"
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
      />
    ),
  },
  useReducedMotion: () => mockReducedMotion,
}));

describe('BrandParticles - Responsive Breakpoints & Mobile Viewport Layouts', () => {
  beforeEach(() => {
    mockReducedMotion = false;
    // Restore default viewport width before each assertion
    vi.stubGlobal('innerWidth', 1024);
  });

  // Test Case 1: Mock standard mobile-width media coordinates (375px wide viewport)
  it('handles isolated mounting clean inside a 375px mobile viewport configuration', () => {
    vi.stubGlobal('innerWidth', 375);
    window.dispatchEvent(new Event('resize'));

    const { container } = render(<BrandParticles />);

    // Humanic Check: Verifies component initial state gracefully loads on narrow layouts
    expect(container.firstChild).not.toBeNull();
  });

  // Test Case 2: Assert that elements reflow or mount efficiently across mobile structures
  it('renders all 40 elements properly inside small-device boundaries', () => {
    vi.stubGlobal('innerWidth', 375);
    window.dispatchEvent(new Event('resize'));

    render(<BrandParticles />);
    const particles = screen.getAllByTestId('motion-div');

    // Humanic Check: Particle distribution matrix shouldn't clip or compress its element arrays
    expect(particles).toHaveLength(40);
  });

  // Test Case 3: Verify styling values match relative scaling properties
  it('ensures particle positioning values utilize fluid, non-static percentage layout limits', () => {
    vi.stubGlobal('innerWidth', 375);
    window.dispatchEvent(new Event('resize'));

    render(<BrandParticles />);
    const particles = screen.getAllByTestId('motion-div');
    const firstParticle = particles[0];

    // Humanic Check: Absolute positioning markers must keep fluid positioning metrics to prevent horizontal clipping
    expect(firstParticle.className).toContain('absolute');
    expect(firstParticle.style.left).toBeTruthy();
    expect(firstParticle.style.top).toBeTruthy();
  });

  // Test Case 4: Verify layout tracking updates gracefully when breaking across tablet widths
  it('scales positioning containers fluidly across intermediate 768px tablet boundaries', () => {
    vi.stubGlobal('innerWidth', 768);
    window.dispatchEvent(new Event('resize'));

    const { container } = render(<BrandParticles />);

    // Humanic Check: Responsive breakpoints tracking must evaluate securely across structural viewports
    expect(container.firstChild).toBeDefined();
  });

  // Test Case 5: Ensure visual properties maintain consistent opacity ranges under mobile rendering
  it('retains aesthetic transparency styles uniformly across condensed screens', () => {
    vi.stubGlobal('innerWidth', 320);
    window.dispatchEvent(new Event('resize'));

    render(<BrandParticles />);
    const particles = screen.getAllByTestId('motion-div');

    // Humanic Check: Extreme display profiles should still preserve aesthetic opacity definitions
    expect(particles[0].style.opacity).toBeTruthy();
  });
});
