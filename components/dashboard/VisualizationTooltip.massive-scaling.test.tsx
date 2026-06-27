// components/dashboard/VisualizationTooltip.massive-scaling.test.tsx
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

describe('VisualizationTooltip - Massive Data Sets & Extreme High Bounds', () => {
  it('renders a payload of 1000 child elements without throwing', () => {
    const massiveChildren = Array.from({ length: 1000 }, (_, i) => <span key={i}>item-{i}</span>);

    expect(() =>
      render(
        <VisualizationTooltip title="Massive Payload" x={120} y={240}>
          <>{massiveChildren}</>
        </VisualizationTooltip>
      )
    ).not.toThrow();

    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toBeInTheDocument();
    expect(tooltip.querySelectorAll('span').length).toBe(1000);
  });

  it('renders 5000 child elements within a generous performance budget', () => {
    const hugeChildren = Array.from({ length: 5000 }, (_, i) => <span key={i}>row-{i}</span>);

    const start = performance.now();
    render(
      <VisualizationTooltip title="Huge Payload" x={50} y={60}>
        <>{hugeChildren}</>
      </VisualizationTooltip>
    );
    const end = performance.now();

    // 5s ceiling mirrors the high-volume test budget used elsewhere in the repo
    expect(end - start).toBeLessThan(5000);
    expect(screen.getByRole('tooltip').querySelectorAll('span').length).toBe(5000);
  });

  it('applies inline style for extremely large x/y coordinate values', () => {
    render(
      <VisualizationTooltip title="Far Edge" x={1_000_000} y={999_999}>
        Content
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveStyle({ left: '1000000px', top: '999999px' });
  });

  it('applies inline style for negative x/y coordinate values', () => {
    render(
      <VisualizationTooltip title="Negative Bounds" x={-1234} y={-5678}>
        Content
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveStyle({ left: '-1234px', top: '-5678px' });
  });

  it('preserves layout constraints when content is highly populated', () => {
    const manyChildren = Array.from({ length: 500 }, (_, i) => (
      <span key={i}>{`contribution line ${i} with extra text`}</span>
    ));

    render(
      <VisualizationTooltip title="Dense" x={0} y={0}>
        <>{manyChildren}</>
      </VisualizationTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    const classNames = tooltip.className.split(' ');

    // Layout classes that must remain applied even with a dense body —
    // they guarantee the tooltip wraps text and pins to its anchor point.
    expect(classNames).toContain('max-w-xs');
    expect(classNames).toContain('fixed');
    expect(classNames).toContain('pointer-events-none');
    expect(tooltip.querySelectorAll('span').length).toBe(500);
  });
});
