/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WallOfLove, { Testimonial } from './WallOfLove';

const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Alice',
    role: 'Software Engineer',
    message: 'This tool is incredible! Saved me hours of manual work.',
    rating: 5,
    tags: ['productivity', 'engineering'],
  },
  {
    id: '2',
    name: 'Bob',
    role: 'Product Manager',
    message: 'Love the analytics dashboard. Clean layout and rich insights.',
    rating: 4,
    tags: ['dashboard', 'design'],
  },
  {
    id: '3',
    name: 'Charlie',
    role: 'Designer',
    message: 'Beautiful design system!',
  },
];

describe('WallOfLove Mouse Interactivity, Tooltips & Touch Propagation', () => {
  const onCardClickMock = vi.fn();
  const tooltipFormatterMock = vi.fn((t) => `Special: ${t.name}`);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test Case 1: Standard component rendering
  it('renders testimonials list, including names, roles, messages and ratings', () => {
    render(<WallOfLove testimonials={mockTestimonials} />);

    expect(screen.getByText('Wall of Love')).toBeDefined();
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Software Engineer')).toBeDefined();
    expect(
      screen.getByText('This tool is incredible! Saved me hours of manual work.')
    ).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
    expect(screen.getByText('Product Manager')).toBeDefined();
    expect(
      screen.getByText('Love the analytics dashboard. Clean layout and rich insights.')
    ).toBeDefined();

    // Verify star ratings
    const rating1 = screen.getByTestId('rating-1');
    expect(rating1.children).toHaveLength(5);
    const rating2 = screen.getByTestId('rating-2');
    expect(rating2.children).toHaveLength(4);
  });

  // Test Case 2: Mouse Hover triggers Tooltip and Cursor Styling
  it('displays tooltip on mouseenter with custom cursor class applied to the active node', () => {
    render(<WallOfLove testimonials={mockTestimonials} />);

    const card = screen.getByTestId('testimonial-card-1');

    // Assert that the appropriate cursor class (cursor-pointer) is applied
    expect(card.className).toContain('cursor-pointer');

    // Tooltip should not be in document initially
    expect(screen.queryByTestId('interactive-tooltip')).toBeNull();

    // Trigger hover
    fireEvent.mouseEnter(card, { clientX: 120, clientY: 150 });

    // Tooltip should now be present
    const tooltip = screen.getByTestId('interactive-tooltip');
    expect(tooltip).toBeDefined();
    expect(within(tooltip).getByText('Alice')).toBeDefined();
    expect(within(tooltip).getByText('5/5 Stars')).toBeDefined();

    // Hover over Charlie (card 3) who has no rating or tags
    const card3 = screen.getByTestId('testimonial-card-3');
    fireEvent.mouseLeave(card);
    fireEvent.mouseEnter(card3, { clientX: 120, clientY: 150 });

    const tooltip3 = screen.getByTestId('interactive-tooltip');
    expect(tooltip3).toBeDefined();
    expect(within(tooltip3).getByText('Charlie')).toBeDefined();
    expect(within(tooltip3).getByText('Verified User')).toBeDefined();
  });

  // Test Case 3: Verify Tooltip displays at computed responsive coordinates
  it('computes and updates tooltip coordinates correctly on mouseenter and mousemove', () => {
    render(<WallOfLove testimonials={mockTestimonials} tooltipFormatter={tooltipFormatterMock} />);

    const container = screen.getByTestId('wall-of-love-container');
    const card = screen.getByTestId('testimonial-card-2');

    // Mock getBoundingClientRect for the container
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      width: 800,
      height: 600,
      right: 900,
      bottom: 700,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    // Hover card at client coordinates (150, 200)
    // Formula: clientX - containerRect.left + 15 => 150 - 100 + 15 = 65px
    // Formula: clientY - containerRect.top + 15 => 200 - 100 + 15 = 115px
    fireEvent.mouseEnter(card, { clientX: 150, clientY: 200 });

    const tooltip = screen.getByTestId('interactive-tooltip');
    expect(tooltip.style.left).toBe('65px');
    expect(tooltip.style.top).toBe('115px');
    expect(screen.getByText('Special: Bob')).toBeDefined();
    expect(tooltipFormatterMock).toHaveBeenCalledWith(mockTestimonials[1]);

    // Move mouse to different coordinates (200, 250)
    // Formula: 200 - 100 + 15 = 115px, 250 - 100 + 15 = 165px
    fireEvent.mouseMove(card, { clientX: 200, clientY: 250 });

    expect(tooltip.style.left).toBe('115px');
    expect(tooltip.style.top).toBe('165px');
  });

  // Test Case 4: Touch events, tooltips, and click propagation
  it('supports touch gestures, computes touch coordinates, and propagates click/touch callbacks correctly', async () => {
    vi.useFakeTimers();
    render(<WallOfLove testimonials={mockTestimonials} onCardClick={onCardClickMock} />);

    const container = screen.getByTestId('wall-of-love-container');
    const card = screen.getByTestId('testimonial-card-1');

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 50,
      top: 50,
      width: 500,
      height: 500,
      right: 550,
      bottom: 550,
      x: 50,
      y: 50,
      toJSON: () => {},
    });

    // Simulate custom touch start gesture at (120, 180)
    // Formula: 120 - 50 + 15 = 85px, 180 - 50 + 15 = 145px
    fireEvent.touchStart(card, {
      touches: [{ clientX: 120, clientY: 180 } as any],
    });

    const tooltip = screen.getByTestId('interactive-tooltip');
    expect(tooltip.style.left).toBe('85px');
    expect(tooltip.style.top).toBe('145px');

    // Simulate touch end gesture
    const touchEndEvent = {
      changedTouches: [{ clientX: 120, clientY: 180 } as any],
    };
    fireEvent.touchEnd(card, touchEndEvent);

    // Verify touchEnd callback propagation
    expect(onCardClickMock).toHaveBeenCalledTimes(1);
    expect(onCardClickMock).toHaveBeenCalledWith(mockTestimonials[0], expect.any(Object));

    // Fast-forward timers to run the setHoveredCardId cleanup in setTimeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // Tooltip should be hidden after timer
    expect(screen.queryByTestId('interactive-tooltip')).toBeNull();

    vi.useRealTimers();

    // Simulate standard click and verify propagation
    fireEvent.click(card);
    expect(onCardClickMock).toHaveBeenCalledTimes(2);
    expect(onCardClickMock).toHaveBeenLastCalledWith(mockTestimonials[0], expect.any(Object));
  });

  // Test Case 5: MouseLeave hides tooltip visuals
  it('removes the interactive tooltip overlay from the DOM on mouseleave', () => {
    render(<WallOfLove testimonials={mockTestimonials} />);

    const card = screen.getByTestId('testimonial-card-1');

    // Hover to show tooltip
    fireEvent.mouseEnter(card, { clientX: 100, clientY: 100 });
    expect(screen.getByTestId('interactive-tooltip')).toBeDefined();

    // Leave to hide tooltip
    fireEvent.mouseLeave(card);
    expect(screen.queryByTestId('interactive-tooltip')).toBeNull();
  });
});
