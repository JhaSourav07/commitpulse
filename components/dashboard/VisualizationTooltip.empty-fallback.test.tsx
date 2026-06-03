// components/dashboard/VisualizationTooltip.empty-fallback.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HTMLAttributes, ReactNode } from 'react';
import VisualizationTooltip from './VisualizationTooltip';
import '@testing-library/jest-dom/vitest';

// framer-motion mock — mirrors the mock used in VisualizationTooltip.test.tsx
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('VisualizationTooltip - Edge Cases & Empty/Missing Inputs', () => {
  it('renders without runtime errors when children is null', () => {
    expect(() =>
      render(
        <VisualizationTooltip title="Empty Children" x={10} y={20}>
          {null}
        </VisualizationTooltip>
      )
    ).not.toThrow();

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('renders without runtime errors when children is undefined', () => {
    expect(() =>
      render(
        <VisualizationTooltip title="Missing Children" x={30} y={40}>
          {undefined}
        </VisualizationTooltip>
      )
    ).not.toThrow();

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('renders without runtime errors when children is an empty fragment', () => {
    expect(() =>
      render(
        <VisualizationTooltip title="Fragment Children" x={50} y={60}>
          <></>
        </VisualizationTooltip>
      )
    ).not.toThrow();

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('preserves the empty title and body containers when both inputs are empty', () => {
    render(
      <VisualizationTooltip title="" x={70} y={80}>
        {null}
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    const titleDiv = tooltip.querySelector('div');
    const bodyDiv = tooltip.querySelectorAll('div')[1];

    expect(tooltip).toBeInTheDocument();
    expect(titleDiv).not.toBeNull();
    expect(titleDiv!.textContent).toBe('');
    expect(bodyDiv).not.toBeNull();
    expect(bodyDiv!.childElementCount).toBe(0);
  });

  it('maintains standard layout styles in the default empty fallback state', () => {
    render(
      <VisualizationTooltip title="" x={90} y={100}>
        {null}
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    const classNames = tooltip.className.split(' ');

    // Core layout classes that must remain applied even when inputs are empty —
    // these guarantee the tooltip still floats correctly and keeps its visual identity.
    const expectedClasses = [
      'pointer-events-none',
      'fixed',
      'z-[9999]',
      'rounded-xl',
      'border',
      'bg-white/95',
      'shadow-2xl',
      'backdrop-blur-md',
      'dark:bg-[#111]/95',
    ];

    for (const className of expectedClasses) {
      expect(classNames).toContain(className);
    }

    expect(tooltip).toHaveStyle({ left: '90px', top: '100px' });
  });
});
