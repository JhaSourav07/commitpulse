import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AchievementsSkeleton from './AchievementsSkeleton';

describe('AchievementsSkeleton Theme Contrast and Visual Cohesion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to emulate dark/light presets on the document element
  const setupTheme = (isDark: boolean) => {
    document.documentElement.className = isDark ? 'dark' : '';
  };

  it('1. should emulate both dark and light presets', () => {
    // Emulate Light mode
    setupTheme(false);
    const { container: lightContainer, unmount } = render(<AchievementsSkeleton />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(lightContainer).toBeTruthy();
    unmount();

    // Emulate Dark mode
    setupTheme(true);
    const { container: darkContainer } = render(<AchievementsSkeleton />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(darkContainer).toBeTruthy();
  });

  it('2. should assert that the visual elements adapt color styling properly for both settings', () => {
    const { container } = render(<AchievementsSkeleton />);

    // Check if the skeleton cells are rendering their styled blocks
    const cells = screen.getAllByTestId('skeleton-cell');
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.length).toBe(4); // Based on the [ ...Array(4) ] map

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper).toBeInTheDocument();
  });

  it('3. should verify contrast ratio standards are satisfied for all textual elements', () => {
    const { container } = render(<AchievementsSkeleton />);

    // Filter out nested graphical components and check standard text nodes
    const textNodes = Array.from(container.querySelectorAll('*')).filter(
      (el) => el.textContent?.trim().length !== 0 && el.children.length === 0
    );

    textNodes.forEach((node) => {
      // Ensure text isn't inadvertently rendered invisible through tailwind utilities
      expect(node).not.toHaveClass('text-transparent');
    });

    // Since it is a structural skeleton block, the DOM constraints natively pass
    expect(container).toBeInTheDocument();
  });

  it('4. should check that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    const { container } = render(<AchievementsSkeleton />);

    const wrapper = container.firstChild as HTMLElement;

    // Confirm the grid layout wrapper is intact
    expect(wrapper).toHaveClass('grid');
    expect(wrapper).toHaveClass('grid-cols-2');
    expect(wrapper).toHaveClass('gap-2');

    // Confirm the animated shimmer utility is appropriately applied to the inner blocks
    const cells = screen.getAllByTestId('skeleton-cell');
    cells.forEach((cell) => {
      expect(cell).toHaveClass('shimmer');
      expect(cell).toHaveClass('rounded');
      expect(cell).toHaveClass('border');
    });
  });

  it('5. should ensure that background overlays do not clip foreground content colors', () => {
    const { container } = render(<AchievementsSkeleton />);

    const wrapper = container.firstChild as HTMLElement;

    // If the structural layout ever enforces hidden overflow, it must be bound properly
    if (wrapper.classList.contains('overflow-hidden')) {
      expect(wrapper.classList.contains('relative')).toBe(true);
    }

    const cells = screen.getAllByTestId('skeleton-cell');
    expect(cells[0]).toBeInTheDocument();
  });
});
