/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import ComparisonStatsCard from './ComparisonStatsCard';

type MockMotionProps = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      style,
      whileInView,
      whileHover,
      whileTap,
      initial,
      animate,
      transition,
      viewport,
      ...rest
    }: any) => (
      <div className={className} style={style} {...rest}>
        {children}
      </div>
    ),
  },
}));

const baseProps = {
  title: 'Total Commits',
  labelA: 'userA',
  labelB: 'userB',
  icon: 'Flame',
};

describe('ComparisonStatsCard — Edge Cases & Empty/Missing Inputs', () => {
  it('renders neutral progress bar when both values are zero', () => {
    const { container } = render(<ComparisonStatsCard {...baseProps} valueA={0} valueB={0} />);

    expect(screen.getByText('userA')).toBeInTheDocument();
    expect(screen.getByText('userB')).toBeInTheDocument();

    const fallback = container.querySelector('.bg-zinc-300.dark\\:bg-zinc-800');
    expect(fallback).toBeInTheDocument();

    expect(screen.queryByText('Winner')).not.toBeInTheDocument();
  });

  it('renders title correctly when title is an empty string', () => {
    const { container } = render(
      <ComparisonStatsCard {...baseProps} valueA={10} valueB={5} title="" />
    );
    expect(screen.getByText('userA')).toBeInTheDocument();
    const titleEl = container.querySelector('p.uppercase');
    expect(titleEl).toBeInTheDocument();
    expect(titleEl).toHaveTextContent('');
  });

  it('falls back to Award icon when an unrecognized icon string is passed', () => {
    const { container } = render(
      <ComparisonStatsCard {...baseProps} valueA={10} valueB={5} icon="NonExistentIcon" />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders both user labels when one value is zero and the other is not', () => {
    render(<ComparisonStatsCard {...baseProps} valueA={0} valueB={50} />);
    expect(screen.getByText('userA')).toBeInTheDocument();
    expect(screen.getByText('userB')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});
