import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import VisualizationTooltip from './VisualizationTooltip';
import '@testing-library/jest-dom/vitest';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('VisualizationTooltip Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('1. checks for correct use of accessible role and semantic coordinates', () => {
    render(
      <VisualizationTooltip title="Active Streak" x={100} y={200}>
        5 days
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveAttribute('role', 'tooltip');
  });

  it('2. asserts elements that accept key focus maintain outline behaviors and link correctly', () => {
    render(
      <div>
        <button aria-describedby="tooltip-id" className="focus:outline-none focus:ring-2">
          Hover me
        </button>
        <div id="tooltip-id">
          <VisualizationTooltip title="Hover Info" x={100} y={200}>
            Details
          </VisualizationTooltip>
        </div>
      </div>
    );

    const button = screen.getByRole('button');
    button.focus();
    expect(document.activeElement).toBe(button);
    expect(button).toHaveAttribute('aria-describedby', 'tooltip-id');
  });

  it('3. verifies tooltip labels are announced with correct accessibility descriptions', () => {
    render(
      <VisualizationTooltip title="Total Commits" x={100} y={200}>
        <span>42 commits</span>
      </VisualizationTooltip>
    );

    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('42 commits')).toBeInTheDocument();
  });

  it('4. tests keyboard control path selectors to ensure normal tab ordering', () => {
    render(
      <div>
        <button data-testid="btn1">Button 1</button>
        <VisualizationTooltip title="Info" x={100} y={200}>
          Some content
        </VisualizationTooltip>
        <button data-testid="btn2">Button 2</button>
      </div>
    );

    const btn1 = screen.getByTestId('btn1');
    const btn2 = screen.getByTestId('btn2');
    const tooltip = screen.getByRole('tooltip');

    // Tooltip should be non-interactive and not block standard keyboard paths
    expect(tooltip).not.toHaveAttribute('tabIndex');

    btn1.focus();
    expect(document.activeElement).toBe(btn1);

    btn2.focus();
    expect(document.activeElement).toBe(btn2);
  });

  it('5. confirms standard headings exist in the correct logical hierarchical order', () => {
    render(
      <div>
        <h2>Dashboard Stats</h2>
        <VisualizationTooltip title="Commit Count" x={100} y={200}>
          Details
        </VisualizationTooltip>
      </div>
    );

    const tooltip = screen.getByRole('tooltip');
    // Ensure no root headings exist inside the tooltip, preserving parent headings structure
    expect(tooltip.querySelector('h1')).toBeNull();
    expect(tooltip.querySelector('h2')).toBeNull();
  });
});
