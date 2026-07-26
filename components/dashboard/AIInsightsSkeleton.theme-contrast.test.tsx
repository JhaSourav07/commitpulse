import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AIInsightsSkeleton from './AIInsightsSkeleton';

describe('AIInsightsSkeleton theme contrast', () => {
  it('renders the skeleton container with theme-aware styles', () => {
    document.documentElement.classList.add('dark');

    const { container } = render(<AIInsightsSkeleton />);
    const root = container.firstElementChild;

    expect(root).toHaveClass('dark:bg-[#0a0a0a]');
    expect(root).toHaveClass('dark:border-[rgba(255,255,255,0.08)]');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('renders the skeleton container in light theme environment without clipping', () => {
    document.documentElement.classList.remove('dark');

    const { container } = render(<AIInsightsSkeleton />);
    const root = container.firstElementChild;

    expect(root).toHaveClass('p-6');
    expect(root).toHaveClass('rounded-xl');
    expect(root).toHaveClass('bg-zinc-50');
    expect(root).toHaveClass('border-black/5');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('keeps shimmer placeholders visible for header contrast', () => {
    const { container } = render(<AIInsightsSkeleton />);
    const shimmerElements = container.querySelectorAll('.shimmer');

    expect(shimmerElements.length).toBeGreaterThanOrEqual(2);
    expect(shimmerElements[0]).toHaveClass('opacity-80');
    expect(shimmerElements[1]).toHaveClass('opacity-80');
  });

  it('renders all insight rows with contrast-safe surfaces', () => {
    const { container } = render(<AIInsightsSkeleton />);
    const rows = container.querySelectorAll('.bg-white.dark\\:bg-\\[\\#111\\].border-black\\/5');

    expect(rows).toHaveLength(3);

    rows.forEach((row) => {
      expect(row).toHaveClass('rounded-lg');
      expect(row).toHaveClass('p-3');
    });
  });

  it('keeps text placeholder opacity layered for readable visual hierarchy', () => {
    const { container } = render(<AIInsightsSkeleton />);
    const highOpacityPlaceholders = container.querySelectorAll('.opacity-80');
    const secondaryPlaceholders = container.querySelectorAll('.opacity-60');

    expect(highOpacityPlaceholders.length).toBeGreaterThan(0);
    expect(secondaryPlaceholders).toHaveLength(3);
  });
});
