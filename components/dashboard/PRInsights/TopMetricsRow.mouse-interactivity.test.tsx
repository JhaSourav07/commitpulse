import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import TopMetricsRow from './TopMetricsRow';
import type { PRInsightData } from '@/services/github/pr-insights';

// Mock framer-motion to map motion.div's hover properties to standard mouse events,
// and render normal elements for motion components.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      onHoverStart,
      onHoverEnd,
      whileHover,
      ...props
    }: {
      children?: React.ReactNode;
      onHoverStart?: () => void;
      onHoverEnd?: () => void;
      whileHover?: Record<string, unknown>;
      [key: string]: unknown;
    }) => (
      <div
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        data-while-hover={JSON.stringify(whileHover)}
        {...props}
      >
        {children}
      </div>
    ),
    circle: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <circle data-testid="motion-circle" {...props}>
        {children}
      </circle>
    ),
  },
}));

describe('TopMetricsRow Mouse & Touch Interactivity', () => {
  const mockData: PRInsightData = {
    totalPRs: 120,
    mergeRate: 87.5,
    avgCycleTime: 14.2,
    avgTimeToFirstReview: 3.6,
    weeklyActivity: [
      {
        prs: 12,
      },
    ],
  } as PRInsightData;

  it('triggers hover state (mouseenter) on a metric card and updates transition classes', () => {
    render(<TopMetricsRow data={mockData} />);

    // Get the first card (Total PRs)
    const card = screen.getByText('Total PRs').closest('div')?.parentElement;
    expect(card).toBeInTheDocument();

    // Before hover, the SVG should have the default non-hovered color class
    const svg = card!.querySelector('svg');
    expect(svg).toHaveClass('text-white/10');
    expect(svg).not.toHaveClass('text-white/25');

    // Simulate mouseenter (hover start)
    fireEvent.mouseEnter(card!);

    // After hover, class should switch to the hovered state
    expect(svg).toHaveClass('text-white/25');
    expect(svg).not.toHaveClass('text-white/10');
  });

  it('renders interactive glowing overlay visuals (motion.circle) inside the SVG on hover', () => {
    const { container } = render(<TopMetricsRow data={mockData} />);

    // Find the card container
    const card = screen.getByText('Total PRs').closest('div')?.parentElement;
    expect(card).toBeInTheDocument();

    // Initially, no motion.circle elements (which are only shown when hovered is true) should be rendered
    expect(container.querySelectorAll('[data-testid="motion-circle"]')).toHaveLength(0);

    // Simulate hover
    fireEvent.mouseEnter(card!);

    // Now, motion.circle elements should be rendered (Total PRs has 4 motion.circle elements when hovered)
    const activeCircles = container.querySelectorAll('[data-testid="motion-circle"]');
    expect(activeCircles.length).toBeGreaterThan(0);

    // Verify glow filter is applied to the active visuals
    activeCircles.forEach((circle) => {
      expect(circle).toHaveAttribute('filter', 'url(#metricGlow)');
    });
  });

  it('hides interactive glowing overlay visuals when mouse leaves the card (mouseleave)', () => {
    const { container } = render(<TopMetricsRow data={mockData} />);

    const card = screen.getByText('Total PRs').closest('div')?.parentElement;
    expect(card).toBeInTheDocument();

    // Hover in
    fireEvent.mouseEnter(card!);
    expect(container.querySelectorAll('[data-testid="motion-circle"]').length).toBeGreaterThan(0);

    // Hover out
    fireEvent.mouseLeave(card!);

    // Glowing elements should be hidden/removed
    expect(container.querySelectorAll('[data-testid="motion-circle"]')).toHaveLength(0);

    // SVG color class should revert to non-hovered state
    const svg = card!.querySelector('svg');
    expect(svg).toHaveClass('text-white/10');
  });

  it('applies appropriate cursor and border style classes for hover interaction states', () => {
    render(<TopMetricsRow data={mockData} />);

    const card = screen.getByText('Total PRs').closest('div')?.parentElement;
    expect(card).toBeInTheDocument();

    // Verify hover border and transition classes are present in className
    expect(card!.className).toContain('hover:border-cyan-500/50');
    expect(card!.className).toContain('transition-colors');
    expect(card!.className).toContain('group');

    // Verify Framer Motion hover configuration scale & Y translation are specified
    const whileHoverAttr = card!.getAttribute('data-while-hover');
    expect(whileHoverAttr).toBeDefined();
    const whileHoverObj = JSON.parse(whileHoverAttr || '{}');
    expect(whileHoverObj).toEqual({ y: -4, scale: 1.02 });
  });

  it('verifies click and touch events propagate correctly from child components to parent listeners', () => {
    const clickSpy = vi.fn();

    // Render with a wrapper that listens for event propagation
    const { container } = render(
      <div onClick={clickSpy} onTouchStart={clickSpy}>
        <TopMetricsRow data={mockData} />
      </div>
    );

    const firstCardTitle = screen.getByText('Total PRs');
    const firstCardValue = screen.getByText('120');

    // Simulate click on title element and check propagation
    fireEvent.click(firstCardTitle);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    // Simulate touchStart on value element and check propagation
    fireEvent.touchStart(firstCardValue);
    expect(clickSpy).toHaveBeenCalledTimes(2);

    // Click SVG icon inside metric card to check propagation
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    fireEvent.click(icon!);
    expect(clickSpy).toHaveBeenCalledTimes(3);
  });
});
