/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WallOfLove, { Testimonial } from './WallOfLove';

const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Alice Developer',
    role: 'Staff Engineer',
    message: 'Highly responsive and beautifully structured grid components!',
    rating: 5,
    tags: ['web', 'react', 'responsive', 'ux', 'mobile', 'frontend'],
  },
  {
    id: '2',
    name: 'Bob Product',
    role: 'Director of Product',
    message: 'Excellent presentation and clean mobile reflow behavior.',
    rating: 4,
    tags: ['mobile-first', 'design'],
  },
];

describe('WallOfLove Responsive Breakpoints & Mobile Viewport Layouts', () => {
  const onCardClickMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Test Case 1: Mock standard mobile-width media coordinates
  it('mocks standard mobile-width viewport dimensions successfully', () => {
    // Set viewport to a standard mobile width of 375px
    vi.stubGlobal('innerWidth', 375);
    vi.stubGlobal('innerHeight', 667);
    window.dispatchEvent(new Event('resize'));

    expect(window.innerWidth).toBe(375);
    expect(window.innerHeight).toBe(667);
  });

  // Test Case 2: Assert columns reflow into standard vertical layout (grid-cols-1)
  it('asserts that grid columns reflow into single-column layout (grid-cols-1) on mobile devices', () => {
    vi.stubGlobal('innerWidth', 375);
    window.dispatchEvent(new Event('resize'));

    render(<WallOfLove testimonials={mockTestimonials} />);

    const grid = screen.getByTestId('testimonials-grid');

    // Check for standard Tailwind layout classes that reflow on different viewports
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');
  });

  // Test Case 3: Verify styling values are responsive and not absolute widths causing horizontal scrollbars
  it('verifies container and card styling do not use absolute widths that could cause horizontal scrollbars', () => {
    render(<WallOfLove testimonials={mockTestimonials} />);

    const container = screen.getByTestId('wall-of-love-container');
    const card1 = screen.getByTestId('testimonial-card-1');
    const card2 = screen.getByTestId('testimonial-card-2');

    // 1. Verify container is set to fill width responsively
    expect(container.className).toContain('w-full');
    expect(container.style.width).not.toContain('px'); // No absolute hardcoded inline pixel width

    // 2. Ensure cards do not contain hardcoded pixel width classes (e.g., w-[500px]) or style properties
    expect(card1.className).not.toMatch(/\bw-\[\d+px\]/);
    expect(card2.className).not.toMatch(/\bw-\[\d+px\]/);
    expect(card1.style.width).toBe('');
    expect(card2.style.width).toBe('');
  });

  // Test Case 4: Check that tag elements and tooltips scale down and wrap gracefully
  it('checks that interactive tooltip and tags scale down gracefully and wrap without clipping', () => {
    render(<WallOfLove testimonials={mockTestimonials} />);

    const card = screen.getByTestId('testimonial-card-1');

    // Hover to trigger tooltip
    fireEvent.mouseEnter(card, { clientX: 100, clientY: 100 });

    const tooltip = screen.getByTestId('interactive-tooltip');

    // 1. Verify tooltip size is constrained to avoid overflowing mobile screen edges
    expect(tooltip.className).toContain('max-w-xs'); // limits width responsively
    expect(tooltip.className).toContain('text-xs'); // uses compact text sizes on mobile

    // 2. Verify tag elements container inside tooltip wraps gracefully
    const tagsContainer = tooltip.querySelector('.flex-wrap');
    expect(tagsContainer).not.toBeNull();
    expect(tagsContainer?.className).toContain('flex-wrap'); // flex-wrap allows items to wrap to next line instead of overflowing
    expect(tagsContainer?.className).toContain('gap-1');

    // 3. Verify tag elements themselves are styled compactly
    const tagElements = tooltip.querySelectorAll('.px-1\\.5');
    expect(tagElements.length).toBeGreaterThan(0);
    tagElements.forEach((tag) => {
      expect(tag.className).toContain('text-[10px]'); // extremely compact text
    });
  });

  // Test Case 5: Assert mobile-specific toggle states respond cleanly
  it('asserts mobile-specific touch interaction toggles tooltip state cleanly with timers', () => {
    vi.useFakeTimers();
    render(<WallOfLove testimonials={mockTestimonials} onCardClick={onCardClickMock} />);

    const container = screen.getByTestId('wall-of-love-container');
    const card = screen.getByTestId('testimonial-card-1');

    // Mock container boundary for coordinate calculations
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 10,
      width: 350,
      height: 400,
      right: 360,
      bottom: 410,
      x: 10,
      y: 10,
      toJSON: () => {},
    });

    // Touch start triggers tooltip displaying at custom responsive mobile coordinates
    // Formula: 120 - 10 + 15 = 125px, 150 - 10 + 15 = 155px
    fireEvent.touchStart(card, {
      touches: [{ clientX: 120, clientY: 150 } as any],
    });

    // Tooltip must be shown immediately on touch
    let tooltip = screen.queryByTestId('interactive-tooltip');
    expect(tooltip).not.toBeNull();
    expect(tooltip!.style.left).toBe('125px');
    expect(tooltip!.style.top).toBe('155px');

    // Touch end fires callback and starts timeout to clear tooltip
    fireEvent.touchEnd(card, {
      changedTouches: [{ clientX: 120, clientY: 150 } as any],
    });

    expect(onCardClickMock).toHaveBeenCalledTimes(1);

    // Tooltip should still be visible right after touchEnd (during the 1s delay)
    tooltip = screen.queryByTestId('interactive-tooltip');
    expect(tooltip).not.toBeNull();

    // Advance timer by 1000ms to clear it
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Tooltip should be hidden after 1000ms delay
    tooltip = screen.queryByTestId('interactive-tooltip');
    expect(tooltip).toBeNull();

    vi.useRealTimers();
  });

  // Test Case 6: Assert clean toggling between multiple cards under touch interactions
  it('toggles active cards and tooltips cleanly when switching touch focus on mobile devices', () => {
    render(<WallOfLove testimonials={mockTestimonials} />);

    const container = screen.getByTestId('wall-of-love-container');
    const card1 = screen.getByTestId('testimonial-card-1');
    const card2 = screen.getByTestId('testimonial-card-2');

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 375,
      height: 500,
      right: 375,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Touch first card
    fireEvent.touchStart(card1, {
      touches: [{ clientX: 50, clientY: 100 } as any],
    });

    let tooltip = screen.getByTestId('interactive-tooltip');
    expect(within(tooltip).getByText('Alice Developer')).toBeDefined();

    // Touch second card immediately - active card should switch immediately
    fireEvent.touchStart(card2, {
      touches: [{ clientX: 50, clientY: 250 } as any],
    });

    tooltip = screen.getByTestId('interactive-tooltip');
    expect(within(tooltip).getByText('Bob Product')).toBeDefined();
    expect(within(tooltip).queryByText('Alice Developer')).toBeNull();
  });
});
