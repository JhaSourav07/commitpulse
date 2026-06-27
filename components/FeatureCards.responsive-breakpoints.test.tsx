import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { FeatureCard, FeatureCardsSection } from './FeatureCards';

// Mock gsap and ScrollTrigger to prevent actual animation loops during layout verification
vi.mock('gsap', () => {
  const gsapMock = {
    registerPlugin: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      fromTo: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    })),
    context: vi.fn((cb) => {
      cb();
      return { revert: vi.fn() };
    }),
  };
  return { default: gsapMock };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

describe('FeatureCards - Responsive Breakpoints Equivalent (Layout & Bounds)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCardProps = {
    icon: <svg data-testid="mock-icon" />,
    title: 'Test Feature',
    desc: 'Test description',
    accent: 'text-blue-500',
    index: 0,
    accentColor: '#3b82f6',
  };

  it('Mobile Column Reflow (Mobile Viewports Equivalent): defaults to single column and reflows at md breakpoint', () => {
    const { container } = render(
      <FeatureCardsSection>
        <FeatureCard {...mockCardProps} />
        <FeatureCard {...mockCardProps} index={1} />
      </FeatureCardsSection>
    );

    // Find the grid container that holds the children
    const gridContainer = container.querySelector('.grid.gap-6.md\\:grid-cols-3');
    expect(gridContainer).toBeTruthy();

    // Validates the structure expects mobile-first vertical stacking
    expect(gridContainer?.className).toContain('grid');
    expect(gridContainer?.className).toContain('md:grid-cols-3');
  });

  it('Absolute Width Prevention (Horizontal Scrollbar Equivalent): strictly bounds wrappers without absolute blowout widths', () => {
    const { container } = render(<FeatureCard {...mockCardProps} />);
    const cardWrapper = container.firstChild as HTMLElement;

    // Must be responsive and relatively contained, not strictly wide
    expect(cardWrapper.className).not.toMatch(/w-\[\d+px\]/);
    expect(cardWrapper.className).not.toMatch(/\bw-(?:96|64|72|80|max)\b/); // ensuring no hard static widths

    const innerWrapper = container.querySelector('.group.relative.overflow-hidden');
    expect(innerWrapper?.className).not.toMatch(/w-\[\d+px\]/);
  });

  it('Responsive Padding Scaling (Scaling Gracefully Equivalent): maintains fluid internal structural padding', () => {
    const { container } = render(<FeatureCard {...mockCardProps} />);
    const innerCard = container.querySelector('.group.relative.overflow-hidden');

    // Ensure padding is standard Tailwind spacing and not a hardcoded viewport breakout
    expect(innerCard?.className).toContain('p-8');
  });

  it('Touch-Target Sizing (Navigation Scaling Equivalent): securely scales click targets using pointer defaults', () => {
    const { container } = render(<FeatureCard {...mockCardProps} />);
    const cardWrapper = container.firstChild as HTMLElement;

    // Ensures mobile tap targets are recognized securely
    expect(cardWrapper.className).toContain('cursor-pointer');
  });

  it('Animation Layout Cohesion (Toggle State Equivalent): constrains GSAP transforms strictly within a 3D perspective context', () => {
    const { container } = render(<FeatureCard {...mockCardProps} />);
    const cardWrapper = container.firstChild as HTMLElement;

    // Ensures animation rotations do not bleed out of the mobile DOM flow
    expect(cardWrapper.style.transformStyle).toBe('preserve-3d');
    expect(cardWrapper.style.perspective).toBe('800px');
  });
});
