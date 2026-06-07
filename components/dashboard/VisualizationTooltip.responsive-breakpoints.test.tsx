import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import VisualizationTooltip from './VisualizationTooltip';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
    }) => <div {...props}>{children}</div>,
  },
}));

describe('VisualizationTooltip - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
  });

  it('renders correctly on a mobile-width viewport', () => {
    render(
      <VisualizationTooltip title="Activity" x={100} y={200}>
        Tooltip content
      </VisualizationTooltip>
    );

    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('uses responsive width constraints suitable for small screens', () => {
    render(
      <VisualizationTooltip title="Activity" x={100} y={200}>
        Tooltip content
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');

    expect(tooltip.className).toContain('max-w-xs');
    expect(tooltip.className).toContain('min-w-max');
  });

  it('does not use fixed-width classes that could cause horizontal scrolling', () => {
    render(
      <VisualizationTooltip title="Activity" x={100} y={200}>
        Tooltip content
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');

    expect(tooltip.className).not.toMatch(/w-\[\d+px\]/);
  });

  it('renders tooltip content correctly on mobile layouts', () => {
    render(
      <VisualizationTooltip title="Activity" x={100} y={200}>
        <div>Commits: 42</div>
      </VisualizationTooltip>
    );

    expect(screen.getByText('Activity')).toBeTruthy();
    expect(screen.getByText('Commits: 42')).toBeTruthy();
  });

  it('maintains viewport-friendly positioning classes', () => {
    render(
      <VisualizationTooltip title="Activity" x={100} y={200}>
        Tooltip content
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');

    expect(tooltip.className).toContain('fixed');
    expect(tooltip.className).toContain('-translate-x-1/2');
    expect(tooltip.className).toContain('-translate-y-full');
  });
});
