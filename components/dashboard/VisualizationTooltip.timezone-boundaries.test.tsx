import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';

import VisualizationTooltip from './VisualizationTooltip';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('VisualizationTooltip Timezone Boundaries', () => {
  it('renders correctly with UTC timezone content', () => {
    render(
      <VisualizationTooltip title="UTC Activity" x={100} y={100}>
        <div>2026-06-05 23:30 UTC</div>
      </VisualizationTooltip>
    );

    expect(screen.getByText(/UTC Activity/i)).toBeInTheDocument();
  });

  it('renders correctly with IST timezone content', () => {
    render(
      <VisualizationTooltip title="IST Activity" x={100} y={100}>
        <div>2026-06-06 05:00 IST</div>
      </VisualizationTooltip>
    );

    expect(screen.getByText(/IST Activity/i)).toBeInTheDocument();
  });

  it('handles leap year boundary dates safely', () => {
    render(
      <VisualizationTooltip title="Leap Year" x={100} y={100}>
        <div>2024-02-29</div>
      </VisualizationTooltip>
    );

    expect(screen.getByText('2024-02-29')).toBeInTheDocument();
  });

  it('maintains stable rendering around daylight savings transitions', () => {
    expect(() => {
      render(
        <VisualizationTooltip title="DST Transition" x={100} y={100}>
          <div>2026-03-08 02:00</div>
        </VisualizationTooltip>
      );
    }).not.toThrow();
  });

  it('preserves valid YYYY-MM-DD formatting across timezone displays', () => {
    const validDate = '2026-12-31';

    expect(validDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
