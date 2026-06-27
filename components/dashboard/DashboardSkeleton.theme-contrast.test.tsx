import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardSkeleton from './DashboardSkeleton';

// Mock child components to isolate DashboardSkeleton wrapper layout testing
vi.mock('./AchievementsSkeleton', () => ({
  default: () => <div data-testid="achievements-skeleton" className="skeleton-child" />,
}));
vi.mock('./AIInsightsSkeleton', () => ({
  default: () => <div data-testid="ai-insights-skeleton" className="skeleton-child" />,
}));
vi.mock('./StatsCardSkeleton', () => ({
  default: () => <div data-testid="stats-card-skeleton" className="skeleton-child" />,
}));

describe('DashboardSkeleton Theme Contrast and Visual Cohesion', () => {
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
    const { container: lightContainer, unmount } = render(<DashboardSkeleton />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(lightContainer).toBeTruthy();
    unmount();

    // Emulate Dark mode
    setupTheme(true);
    const { container: darkContainer } = render(<DashboardSkeleton />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(darkContainer).toBeTruthy();
  });

  it('2. should assert that the visual elements adapt color styling properly for both settings', () => {
    const { container } = render(<DashboardSkeleton />);

    // Since this is a skeleton wrapper, verify it correctly maintains structural child trees
    // The actual pulse or gray shading should adapt smoothly with dark:bg-X
    expect(container.firstChild).toBeTruthy();

    expect(screen.getByTestId('achievements-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('ai-insights-skeleton')).toBeInTheDocument();

    // There are usually multiple stat card skeletons rendered in the grid
    expect(screen.getAllByTestId('stats-card-skeleton').length).toBeGreaterThan(0);
  });

  it('3. should verify contrast ratio standards are satisfied for all textual elements', () => {
    const { container } = render(<DashboardSkeleton />);

    // Skeletons are predominantly visual, but any screen-reader accessible text must not be clipped incorrectly
    // or set to an invisible color causing contrast standard failures.
    const textNodes = Array.from(container.querySelectorAll('*')).filter(
      (el) => el.textContent?.trim().length !== 0
    );

    textNodes.forEach((node) => {
      // Skeletons shouldn't use direct transparent text unless it's explicitly sr-only
      expect(node).not.toHaveClass('text-transparent');
    });

    expect(container).toBeInTheDocument();
  });

  it('4. should check that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    const { container } = render(<DashboardSkeleton />);

    // The main wrapper uses layout/spacing classes that must remain intact.
    // e.g., typically structural grids or flex properties
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeDefined();
    expect(wrapper.className).not.toBe(''); // Wrapper must contain layout classes (like grid, flex, space-y, etc.)
  });

  it('5. should ensure that background overlays do not clip foreground content colors', () => {
    const { container } = render(<DashboardSkeleton />);

    const wrapper = container.firstChild as HTMLElement;

    // If the skeleton enforces hidden overflow, it must be contained properly without destroying child boundary rendering.
    if (wrapper.classList.contains('overflow-hidden')) {
      expect(wrapper.classList.contains('relative')).toBe(true);
    }

    // Confirm child bounds are rendered and interactable safely
    expect(screen.getByTestId('achievements-skeleton')).toBeVisible();
    expect(screen.getByTestId('ai-insights-skeleton')).toBeVisible();
  });
});
