//@ts-ignore
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BrandParticles from './BrandParticles';

// Mock framer-motion to avoid animation loops during testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, ...props }: React.ComponentPropsWithoutRef<'div'>) => (
      <div style={style} data-testid="mock-particle" {...props}>
        {children}
      </div>
    ),
  },
  // Add the missing hook export that the component expects
  useReducedMotion: () => false,
  // Safely mock AnimatePresence as a simple wrapper component
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('BrandParticles Component', () => {
  // REQUIREMENT 1 & 2 (Issue 1099): Renders container layout correctly after mount
  it('should render inside a fixed positioned container layout after mount', () => {
    const { container } = render(<BrandParticles />);
    const outerWrapper = container.querySelector('div');
    expect(outerWrapper?.className).toContain('fixed');
    expect(outerWrapper?.className).toContain('inset-0');
  });

  // REQUIREMENT 3 & 4 (Issue 1099 & 1100): Renders 40 particles with correct colors matching palette
  it('should render exactly 40 particle elements containing valid predefined brand colors', () => {
    render(<BrandParticles />);

    // We match against both HEX and computed RGB layout styles to clear DOM conversion boundaries
    const validHexColors = ['#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#3b82f6'];
    const validRgbColors = [
      'rgb(16, 185, 129)',
      'rgb(139, 92, 246)',
      'rgb(6, 182, 212)',
      'rgb(245, 158, 11)',
      'rgb(59, 130, 246)',
    ];

    const particles = screen.getAllByTestId('mock-particle');

    // Assert the exact count rule
    expect(particles.length).toBe(40);

    // Validate background colors for every single spawned node
    particles.forEach((particle) => {
      const bgColor = particle.style.backgroundColor;
      expect(bgColor).toBeDefined();

      const isValidColor = validHexColors.includes(bgColor) || validRgbColors.includes(bgColor);
      expect(isValidColor).toBe(true);
    });
  });
});
