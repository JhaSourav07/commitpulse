import { fireEvent, render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StatsCard from './StatsCard';

type MotionProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  initial?: Record<string, unknown>;
  whileInView?: Record<string, unknown>;
  viewport?: Record<string, unknown>;
  whileHover?: Record<string, unknown>;
  transition?: Record<string, unknown>;
};

const motionState = vi.hoisted(() => ({
  lastProps: undefined as MotionProps | undefined,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial,
      whileInView,
      viewport,
      whileHover,
      transition,
      ...props
    }: MotionProps) => {
      motionState.lastProps = {
        ...props,
        initial,
        whileInView,
        viewport,
        whileHover,
        transition,
      };

      return (
        <div {...props} data-testid="stats-card-motion">
          {children}
        </div>
      );
    },
  },
}));

vi.mock('lucide-react', () => ({
  Flame: ({ className }: { className?: string }) => (
    <svg data-testid="icon-flame" className={className} />
  ),
  TrendingUp: ({ className }: { className?: string }) => (
    <svg data-testid="icon-trending-up" className={className} />
  ),
  GitCommit: ({ className }: { className?: string }) => (
    <svg data-testid="icon-git-commit" className={className} />
  ),
}));

const renderStatsCard = () =>
  render(
    <StatsCard title="Active Streak" value="42" description="days in a row" icon="TrendingUp" />
  );

describe('StatsCard mouse interactivity', () => {
  beforeEach(() => {
    motionState.lastProps = undefined;
  });

  it('keeps the card lift animation wired through framer-motion hover props', () => {
    renderStatsCard();

    expect(motionState.lastProps?.whileHover).toEqual({ y: -2 });
    expect(motionState.lastProps?.transition).toMatchObject({
      duration: 0.2,
      ease: 'easeOut',
    });
  });

  it('uses hover-aware container classes without losing the rendered card content', () => {
    renderStatsCard();

    const card = screen.getByTestId('stats-card-motion');

    expect(card.className).toContain('group');
    expect(card.className).toContain('hover:border-black/20');
    expect(card.className).toContain('hover:shadow-[0_0_24px_rgba(99,102,241,0.08)]');

    fireEvent.mouseEnter(card);
    expect(screen.getByText('Active Streak')).toBeDefined();

    fireEvent.mouseLeave(card);
    expect(screen.getByText('42')).toBeDefined();
  });

  it('applies group hover classes to the icon wrapper and icon color transition', () => {
    const { container } = renderStatsCard();

    const icon = screen.getByTestId('icon-trending-up');
    const iconWrapper = icon.parentElement;

    expect(iconWrapper?.className).toContain('group-hover:border-[rgba(99,102,241,0.2)]');
    expect(icon.getAttribute('class')).toContain('group-hover:text-black');
    expect(icon.getAttribute('class')).toContain('dark:group-hover:text-white');

    fireEvent.mouseEnter(container.firstElementChild as Element);
    expect(screen.getByTestId('icon-trending-up')).toBeDefined();
  });

  it('renders the mini chart with hover opacity transitions and stable bar heights', () => {
    const { container } = renderStatsCard();

    const chart = container.querySelector('.group-hover\\:opacity-80');
    const bars = chart?.querySelectorAll('.rounded-t-\\[1px\\]');

    expect(chart?.className).toContain('transition-opacity');
    expect(chart?.className).toContain('group-hover:opacity-80');
    expect(bars).toHaveLength(12);

    bars?.forEach((bar) => {
      expect((bar as HTMLElement).style.height).toMatch(/%$/);
    });
  });

  it('allows click and touch events to bubble from the rendered card', () => {
    const handleClick = vi.fn();
    const handleTouchStart = vi.fn();

    render(
      <div onClick={handleClick} onTouchStart={handleTouchStart}>
        <StatsCard title="Total Commits" value="120" description="all time" icon="GitCommit" />
      </div>
    );

    const card = screen.getByTestId('stats-card-motion');

    fireEvent.click(card);
    fireEvent.touchStart(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleTouchStart).toHaveBeenCalledTimes(1);
  });
});
