import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TopRivalriesTicker from './TopRivalriesTicker';

const pushMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
    }: {
      children?: React.ReactNode;
      className?: string;
      animate?: unknown;
      transition?: unknown;
    }) => (
      <div className={className} data-testid="rivalries-marquee">
        {children}
      </div>
    ),
  },
}));

const UNIQUE_RIVALRIES = [
  { u1: 'torvalds', u2: 'gaearon', label: 'Kernel vs React' },
  { u1: 'rich-harris', u2: 'antfu', label: 'Svelte vs Nuxt' },
  { u1: 'shadcn', u2: 'pacocoursey', label: 'UI Masters' },
  { u1: 'vercel', u2: 'netlify', label: 'Platform Wars' },
  { u1: 'dhh', u2: 'taylorotwell', label: 'Ruby vs PHP' },
  { u1: 'jhasourav07', u2: 'leerob', label: 'Rising vs Vet' },
] as const;

const getTickerItems = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.group.flex.items-center.gap-3'));

describe('TopRivalriesTicker - Massive Data Sets and Extreme High Bounds Scaling', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('duplicates every rivalry into a bounded marquee without dropping ticker items', () => {
    const start = performance.now();
    const { container } = render(<TopRivalriesTicker />);
    const duration = performance.now() - start;

    expect(screen.getByTestId('rivalries-marquee')).toHaveClass('flex', 'whitespace-nowrap');
    expect(getTickerItems(container)).toHaveLength(UNIQUE_RIVALRIES.length * 2);
    expect(duration).toBeLessThan(1000);

    UNIQUE_RIVALRIES.forEach(({ u1, u2, label }) => {
      expect(screen.getAllByText(u1)).toHaveLength(2);
      expect(screen.getAllByText(u2)).toHaveLength(2);
      expect(screen.getAllByText(label)).toHaveLength(2);
    });
  });

  it('keeps the ticker tree overflow-contained so densely repeated items cannot expand the viewport', () => {
    const { container } = render(<TopRivalriesTicker />);
    const tickerRoot = container.firstElementChild;
    const marquee = screen.getByTestId('rivalries-marquee');

    expect(tickerRoot).toHaveClass('w-full', 'overflow-hidden', 'relative', 'flex', 'items-center');
    expect(marquee).toHaveClass('whitespace-nowrap');

    getTickerItems(container).forEach((item) => {
      expect(item).toHaveClass('flex', 'items-center', 'gap-3', 'rounded-full');
      expect(item.querySelectorAll('span')).toHaveLength(4);
    });
  });

  it('renders many mounted ticker instances under a high-volume page load without breaking the DOM tree', () => {
    const start = performance.now();
    const { container } = render(
      <div>
        {Array.from({ length: 150 }, (_, index) => (
          <TopRivalriesTicker key={index} />
        ))}
      </div>
    );
    const duration = performance.now() - start;

    expect(screen.getAllByTestId('rivalries-marquee')).toHaveLength(150);
    expect(getTickerItems(container)).toHaveLength(150 * UNIQUE_RIVALRIES.length * 2);
    expect(screen.getAllByText('VS')).toHaveLength(150 * UNIQUE_RIVALRIES.length * 2);
    expect(duration).toBeLessThan(5000);
  });

  it('keeps SVG icon bounds finite and consistently scaled across the duplicated high-bound marquee', () => {
    const { container } = render(<TopRivalriesTicker />);
    const icons = Array.from(container.querySelectorAll('svg'));

    expect(icons).toHaveLength(UNIQUE_RIVALRIES.length * 2);

    icons.forEach((icon) => {
      expect(icon).toHaveAttribute('width', '14');
      expect(icon).toHaveAttribute('height', '14');
      expect(icon.getAttribute('viewBox')).toMatch(/^0 0 \d+ \d+$/);

      Array.from(icon.attributes).forEach((attribute) => {
        expect(attribute.value).not.toMatch(/NaN|Infinity|-Infinity/);
      });
    });
  });

  it('handles repeated dense item clicks and preserves encoded comparison routes', () => {
    const { container } = render(<TopRivalriesTicker />);
    const tickerItems = getTickerItems(container);

    tickerItems.forEach((item) => fireEvent.click(item));

    expect(pushMock).toHaveBeenCalledTimes(UNIQUE_RIVALRIES.length * 2);
    UNIQUE_RIVALRIES.forEach(({ u1, u2 }) => {
      expect(pushMock).toHaveBeenCalledWith(`/compare?user1=${u1}&user2=${u2}`);
    });
  });
});
