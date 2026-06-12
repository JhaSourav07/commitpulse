/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GrowthTrendChart from './GrowthTrendChart';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.whileInView;
      delete props.viewport;
      delete props.transition;

      return (
        <div className={className} style={style} {...props}>
          {children}
        </div>
      );
    },

    path: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.transition;

      return (
        <path className={className} style={style} {...props}>
          {children}
        </path>
      );
    },
  },
}));

describe('GrowthTrendChart Edge Cases & Empty/Missing Inputs Verification', () => {
  it('renders successfully with empty activity arrays', () => {
    const { container } = render(
      <GrowthTrendChart activityA={[]} activityB={[]} labelA="User A" labelB="User B" />
    );

    expect(screen.getByText('Contribution Growth Trend')).toBeInTheDocument();

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('maintains default layout styling in empty state', () => {
    const { container } = render(
      <GrowthTrendChart activityA={[]} activityB={[]} labelA="User A" labelB="User B" />
    );

    const chartContainer = screen.getByTestId('growth-trend-chart-container');

    expect(chartContainer).toBeInTheDocument();

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 500 180');
    expect(svg?.getAttribute('class')).toContain('w-full');
  });

  it('renders expected empty timeline markers without runtime errors', () => {
    render(<GrowthTrendChart activityA={[]} activityB={[]} labelA="User A" labelB="User B" />);

    const tieBadges = screen.getAllByText('Tie');

    expect(tieBadges.length).toBeGreaterThan(0);
  });

  it('renders key DOM structures when datasets are empty', () => {
    const { container } = render(
      <GrowthTrendChart activityA={[]} activityB={[]} labelA="User A" labelB="User B" />
    );

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('defs')).not.toBeNull();

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(4);

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(5);
  });

  it('renders labels and timeline section with empty input data', () => {
    render(<GrowthTrendChart activityA={[]} activityB={[]} labelA="Empty A" labelB="Empty B" />);

    expect(screen.getByText('Empty A')).toBeInTheDocument();
    expect(screen.getByText('Empty B')).toBeInTheDocument();

    expect(screen.getByText('⚔️ Commit Battle Timeline')).toBeInTheDocument();
  });
});
