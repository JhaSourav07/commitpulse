import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StatsCardSkeleton from './StatsCardSkeleton';

describe('StatsCardSkeleton - Theme Contrast', () => {
  it('renders the skeleton container', () => {
    const { container } = render(<StatsCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('contains light mode styling classes', () => {
    const { container } = render(<StatsCardSkeleton />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('border');
  });

  it('contains dark mode styling classes', () => {
    const { container } = render(<StatsCardSkeleton />);
    const card = container.firstChild as HTMLElement;

    expect(card.className).toContain('dark:bg-[#0a0a0a]');
    expect(card.className).toContain('dark:border-[rgba(255,255,255,0.08)]');
  });

  it('renders shimmer placeholders', () => {
    const { container } = render(<StatsCardSkeleton />);
    const shimmerElements = container.querySelectorAll('.shimmer');

    expect(shimmerElements.length).toBeGreaterThan(0);
  });

  it('renders all chart bars with deterministic heights', () => {
    const { container } = render(<StatsCardSkeleton />);
    const bars = container.querySelectorAll('.rounded-t-\\[1px\\]');

    expect(bars.length).toBe(12);
  });

  it('maintains visual hierarchy elements', () => {
    render(<StatsCardSkeleton />);

    expect(document.querySelectorAll('.shimmer').length).toBeGreaterThan(0);
  });
});
