// components/dashboard/VisualizationTooltip.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HTMLAttributes, ReactNode } from 'react';
import VisualizationTooltip from './VisualizationTooltip';
import '@testing-library/jest-dom/vitest';

// framer-motion mock
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('VisualizationTooltip', () => {
  it('renders tooltip role', () => {
    render(
      <VisualizationTooltip title="Tooltip Title" x={100} y={200}>
        Content
      </VisualizationTooltip>
    );

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('renders title correctly', () => {
    render(
      <VisualizationTooltip title="Commits" x={100} y={200}>
        Content
      </VisualizationTooltip>
    );

    expect(screen.getByText('Commits')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <VisualizationTooltip title="Title" x={100} y={200}>
        <span>5 contributions</span>
      </VisualizationTooltip>
    );

    expect(screen.getByText('5 contributions')).toBeInTheDocument();
  });

  it('applies x and y coordinates to style', () => {
    render(
      <VisualizationTooltip title="Title" x={150} y={250}>
        Content
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveStyle({
      left: '150px',
      top: '250px',
    });
  });

  it('renders nested React elements passed as children', () => {
    render(
      <VisualizationTooltip title="Stats" x={10} y={20}>
        <>
          <div>Total: 10</div>
          <div>Today: 2</div>
        </>
      </VisualizationTooltip>
    );

    expect(screen.getByText('Total: 10')).toBeInTheDocument();
    expect(screen.getByText('Today: 2')).toBeInTheDocument();
  });
});
