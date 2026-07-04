import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import StatsCardSkeleton from './StatsCardSkeleton';

describe('StatsCardSkeleton — mouse interactivity', () => {
  it('renders the skeleton container and verifies it is present in the document', () => {
    const { container } = render(<StatsCardSkeleton />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.tagName).toBe('DIV');
  });

  it('does not apply pointer-events-none to the skeleton wrapper so hover events propagate', () => {
    const { container } = render(<StatsCardSkeleton />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).not.toContain('pointer-events-none');
  });

  it('triggers mouseenter and mouseleave on the skeleton container without errors', async () => {
    const user = userEvent.setup();
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();

    const { container } = render(
      <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <StatsCardSkeleton />
      </div>
    );

    const wrapper = container.firstChild as HTMLElement;

    await user.hover(wrapper);
    expect(onMouseEnter).toHaveBeenCalledTimes(1);

    await user.unhover(wrapper);
    expect(onMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('renders exactly 12 shimmer bar elements inside the micro chart skeleton', () => {
    const { container } = render(<StatsCardSkeleton />);

    const chartWrapper = container.querySelector('.flex.items-end.justify-between');
    expect(chartWrapper).not.toBeNull();

    const bars = chartWrapper!.querySelectorAll('.shimmer');
    expect(bars).toHaveLength(12);
  });

  it('verifies click event propagates through the skeleton wrapper to a parent handler', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    const { container } = render(
      <div onClick={handleClick}>
        <StatsCardSkeleton />
      </div>
    );

    const wrapper = container.firstChild as HTMLElement;

    await user.click(wrapper);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
