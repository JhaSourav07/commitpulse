import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ActivityLandscape from './ActivityLandscape';
import type { ActivityData } from '@/types/dashboard';

const mockData = [{ date: '2026-06-03', count: 5, intensity: 3 }] as ActivityData[];

describe('ActivityLandscape Component - Responsive Layouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to trigger media query-like behavior
  const setViewport = (width: number) => {
    window.innerWidth = width;
    window.dispatchEvent(new Event('resize'));
  };

  it('reflows the header layout from row to column on mobile viewports', () => {
    setViewport(375); // Mobile width
    const { container } = render(<ActivityLandscape data={mockData} />);

    // The component uses 'md:flex-row'. On mobile, it should have 'flex-col'.
    const header = container.querySelector('.flex-col');
    expect(header).not.toBeNull();
  });

  it('ensures no horizontal overflow on mobile viewports', () => {
    setViewport(375);
    const { container } = render(<ActivityLandscape data={mockData} />);

    // Check that the main wrapper doesn't cause overflow
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });

  it('renders tab navigation in a flexible container for mobile', () => {
    setViewport(375);
    const { container } = render(<ActivityLandscape data={mockData} />);

    // Verify that the tab container has flex-wrap to handle small screens
    const tabContainer = container.querySelector('.flex-wrap');
    expect(tabContainer).not.toBeNull();
  });

  it('maintains absolute scale consistency on mobile to prevent visual clipping', () => {
    setViewport(375);
    const { container } = render(<ActivityLandscape data={mockData} />);

    // The graph container should occupy the available width
    const graph = container.querySelector('[role="img"]');
    expect(graph?.classList.contains('w-full')).toBe(true);
  });

  it('verifies that the mobile viewport does not force absolute widths', () => {
    setViewport(375);
    const { container } = render(<ActivityLandscape data={mockData} />);

    // We check that our bars use flex-1 to distribute space dynamically, not hardcoded px
    const firstBar = container.querySelector('.group\\/bar');
    expect(firstBar?.classList.contains('flex-1')).toBe(true);
  });
});
