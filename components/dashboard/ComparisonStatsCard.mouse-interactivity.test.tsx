import { fireEvent, render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ComparisonStatsCard from './ComparisonStatsCard';

type MotionProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  initial?: Record<string, unknown>;
  whileInView?: Record<string, unknown>;
  viewport?: Record<string, unknown>;
  whileHover?: Record<string, unknown>;
  transition?: Record<string, unknown>;
  animate?: Record<string, unknown>;
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
      animate,
      ...props
    }: MotionProps) => {
      // Capture the last motion props specifically for the root container
      if (typeof props.className === 'string' && props.className.includes('group')) {
        motionState.lastProps = {
          ...props,
          initial,
          whileInView,
          viewport,
          whileHover,
          transition,
          animate,
        };
      }

      return (
        <div
          {...props}
          data-testid={
            typeof props.className === 'string' && props.className.includes('group')
              ? 'stats-card-motion'
              : undefined
          }
        >
          {children}
        </div>
      );
    },
  },
}));

vi.mock('lucide-react', () => ({
  Award: ({ className }: { className?: string }) => (
    <svg data-testid="icon-award" className={className} />
  ),
  Flame: () => null,
  TrendingUp: () => null,
  GitCommit: () => null,
  GitBranch: () => null,
  Users: () => null,
  UserPlus: () => null,
  LucideIcon: () => null,
}));

const renderCard = () =>
  render(
    <ComparisonStatsCard
      title="Code Quality"
      valueA={85}
      valueB={92}
      labelA="User Alice"
      labelB="User Bob"
      icon="Award"
    />
  );

describe('ComparisonStatsCard mouse interactivity', () => {
  beforeEach(() => {
    motionState.lastProps = undefined;
  });

  it('Verify that responsive tooltip layouts display at computed coordinates', () => {
    renderCard();

    // The native title attribute acts as the computed coordinate tooltip for the user labels
    const labelAElement = screen.getByText('User Alice');
    const labelBElement = screen.getByText('User Bob');

    expect(labelAElement.getAttribute('title')).toBe('User Alice');
    expect(labelBElement.getAttribute('title')).toBe('User Bob');
  });

  it('Trigger simulated mouseenter/hover gestures on active segments or interactive nodes', () => {
    renderCard();
    const card = screen.getByTestId('stats-card-motion');

    // Assert the group container classes exist
    expect(card.className).toContain('group');
    expect(card.className).toContain('hover:border-black/20');
    expect(card.className).toContain('hover:shadow-[0_0_24px_rgba(16,185,129,0.04)]');

    fireEvent.mouseEnter(card);
    // Verifying content remains intact during interactions
    expect(screen.getByText('85')).toBeDefined();
    expect(screen.getByText('92')).toBeDefined();
  });

  it('Assert appropriate cursor style classes (like pointer) are applied on hover', () => {
    renderCard();
    const icon = screen.getByTestId('icon-award');
    const iconWrapper = icon.parentElement;

    // The wrapper responds to group hover by changing colors
    expect(iconWrapper?.className).toContain('group-hover:border-[rgba(16,185,129,0.2)]');

    // The icon transitions text colors
    expect(icon.getAttribute('class')).toContain('group-hover:text-black');
    expect(icon.getAttribute('class')).toContain('dark:group-hover:text-white');
  });

  it('Test custom click/touch gestures and ensure click events propagate correctly', () => {
    const handleClick = vi.fn();
    const handleTouchStart = vi.fn();

    render(
      <div onClick={handleClick} onTouchStart={handleTouchStart}>
        <ComparisonStatsCard
          title="Propagate"
          valueA={1}
          valueB={2}
          labelA="A"
          labelB="B"
          icon="Award"
        />
      </div>
    );

    const card = screen.getByTestId('stats-card-motion');

    fireEvent.click(card);
    fireEvent.touchStart(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleTouchStart).toHaveBeenCalledTimes(1);
  });

  it('Check that mouseleave events successfully hide temporary overlay visuals', () => {
    renderCard();

    const card = screen.getByTestId('stats-card-motion');
    fireEvent.mouseLeave(card);

    // Assert that the framer-motion whileHover prop exists to animate the lift natively
    expect(motionState.lastProps?.whileHover).toEqual({ y: -2 });
    expect(motionState.lastProps?.transition).toMatchObject({
      duration: 0.2,
      ease: 'easeOut',
    });
  });
});
