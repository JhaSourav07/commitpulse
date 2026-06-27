import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import VisualizationTooltip from './VisualizationTooltip';
import React from 'react';

// 1. Mock framer-motion to test animation integrations
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: {
      children?: React.ReactNode;
      initial?: object;
      animate?: object;
      exit?: object;
      transition?: object;
      [key: string]: unknown;
    }) => (
      <div
        data-testid="framer-motion-div"
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        {...props}
      >
        {children}
      </div>
    ),
  },
}));

describe('VisualizationTooltip - Real Component Integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the actual component directly instead of a wrapper mock', () => {
    render(
      <VisualizationTooltip title="Actual Component Title" x={10} y={20}>
        <span>Actual Component Content</span>
      </VisualizationTooltip>
    );

    expect(screen.getByText('Actual Component Title')).toBeDefined();
    expect(screen.getByText('Actual Component Content')).toBeDefined();
  });

  it('integrates correctly with positional coordinate props provided from parent charts', () => {
    render(
      <VisualizationTooltip title="Position Test" x={150} y={250}>
        <span>Coordinates</span>
      </VisualizationTooltip>
    );

    const tooltip = screen.getByTestId('framer-motion-div');
    expect(tooltip.style.left).toBe('150px');
    expect(tooltip.style.top).toBe('250px');
  });

  it('asserts the tooltip uses the correct accessible roles for screen readers', () => {
    render(
      <VisualizationTooltip title="A11y Test" x={0} y={0}>
        <span>Role Check</span>
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeDefined();
    expect(tooltip.className).toContain('pointer-events-none');
    expect(tooltip.className).toContain('fixed');
    expect(tooltip.className).toContain('z-[9999]');
  });

  it('verifies integration with the mocked framer-motion library properties', () => {
    render(
      <VisualizationTooltip title="Animation Setup" x={5} y={5}>
        <span>Animation State</span>
      </VisualizationTooltip>
    );

    const motionDiv = screen.getByTestId('framer-motion-div');
    // Verify the framer-motion integration handles the initial/animate props
    expect(motionDiv.getAttribute('data-initial')).toContain('opacity');
    expect(motionDiv.getAttribute('data-animate')).toContain('opacity');
  });

  it('renders complex children correctly within the tooltip container', () => {
    render(
      <VisualizationTooltip title="Complex Children" x={0} y={0}>
        <div data-testid="complex-child">
          <p>Line 1</p>
          <p>Line 2</p>
        </div>
      </VisualizationTooltip>
    );

    expect(screen.getByTestId('complex-child')).toBeDefined();
    expect(screen.getByText('Line 1')).toBeDefined();
    expect(screen.getByText('Line 2')).toBeDefined();
  });
});
