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
    div: ({ children, ...props }: MockMotionProps) => <div {...props}>{children}</div>,
  },
}));

const defaultProps = {
  title: 'Total Commits',
  valueA: 120,
  valueB: 80,
  labelA: 'userA',
  labelB: 'userB',
  icon: 'Flame',
};

describe('ComparisonStatsCard — Accessibility & Screen Reader Compliance', () => {
  it('renders card as a named region landmark with correct aria-label', () => {
    render(<ComparisonStatsCard {...defaultProps} />);

    const region = screen.getByRole('region', {
      name: 'Total Commits comparison between userA and userB',
    });
    expect(region).toBeInTheDocument();
  });

  it('links value numbers to user labels via aria-describedby', () => {
    const { container } = render(<ComparisonStatsCard {...defaultProps} />);

    const idA = 'label-a-total-commits';
    const idB = 'label-b-total-commits';

    expect(container.querySelector(`#${idA}`)).toHaveTextContent('userA');
    expect(container.querySelector(`#${idB}`)).toHaveTextContent('userB');

    const valueA = container.querySelector(`[aria-describedby="${idA}"]`);
    const valueB = container.querySelector(`[aria-describedby="${idB}"]`);
    expect(valueA).toBeInTheDocument();
    expect(valueB).toBeInTheDocument();
  });

  it('renders Winner badge with aria-live and descriptive aria-label', () => {
    const { container } = render(<ComparisonStatsCard {...defaultProps} />);

    const winner = container.querySelector('[aria-live="polite"]');
    expect(winner).toBeInTheDocument();
    expect(winner).toHaveAttribute('aria-label', 'userA is the winner');
    expect(winner).toHaveTextContent('Winner');
  });

  it('renders progress bar with correct role and aria value attributes', () => {
    render(<ComparisonStatsCard {...defaultProps} />);

    const progressbar = screen.getByRole('progressbar', {
      name: 'userA vs userB progress comparison',
    });

    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '60');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  it('hides decorative icon and divider from screen readers via aria-hidden', () => {
    const { container } = render(<ComparisonStatsCard {...defaultProps} />);

    const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenElements.length).toBeGreaterThanOrEqual(2);

    const iconWrapper = container.querySelector('.rounded-lg[aria-hidden="true"]');
    expect(iconWrapper).toBeInTheDocument();

    const divider = container.querySelector('.absolute.left-1\\/2[aria-hidden="true"]');
    expect(divider).toBeInTheDocument();
  });
});
