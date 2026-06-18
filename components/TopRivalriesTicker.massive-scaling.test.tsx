import type { ComponentProps } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TopRivalriesTicker from './TopRivalriesTicker';
import type { RivalryItem } from './TopRivalriesTicker';

vi.mock('framer-motion', () => ({
  motion: {
    // Strip framer-motion animation props so they are not forwarded to the DOM,
    // but spread remaining HTML attributes (onClick, role, aria-*, data-*, etc.)
    // so the mock doesn't silently swallow behaviour under test.
    div: ({
      children,
      className,
      style,
      animate,
      initial,
      whileInView,
      viewport,
      transition,
      ...rest
    }: ComponentProps<'div'> & { [key: string]: unknown }) => (
      <div className={className} style={style} {...rest}>
        {children}
      </div>
    ),
  },
}));

vi.mock('lucide-react', () => ({
  Flame: vi.fn(() => null),
  Zap: vi.fn(() => null),
  Trophy: vi.fn(() => null),
  Target: vi.fn(() => null),
  Star: vi.fn(() => null),
  Swords: vi.fn(() => null),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

const MockIcon = vi.fn(() => null);

function makeRivalries(count: number): RivalryItem[] {
  return Array.from({ length: count }, (_, i) => ({
    u1: `user-a-${i}`,
    u2: `user-b-${i}`,
    label: `Match ${i}`,
    icon: MockIcon,
    color: 'text-orange-500',
  }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('TopRivalriesTicker — massive scaling', () => {
  it('renders 1 000 rivalry items without crashing and keeps first and last entries in the DOM', () => {
    const rivalries = makeRivalries(1000);
    expect(() => render(<TopRivalriesTicker rivalries={rivalries} />)).not.toThrow();
    expect(screen.getAllByText('user-a-0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('user-a-999').length).toBeGreaterThanOrEqual(1);
  });

  it('marquee duplication renders exactly twice as many VS separators as rivalry items', () => {
    const rivalries = makeRivalries(20);
    render(<TopRivalriesTicker rivalries={rivalries} />);
    // The component maps [...items, ...items] so there should be rivalries.length * 2 VS nodes.
    expect(screen.getAllByText('VS')).toHaveLength(rivalries.length * 2);
  });

  it('renders 200-character usernames in the DOM without crashing', () => {
    const longName = 'x'.repeat(200);
    const rivalries: RivalryItem[] = [
      {
        u1: longName,
        u2: 'short',
        label: 'Long Name Test',
        icon: MockIcon,
        color: 'text-indigo-400',
      },
    ];
    render(<TopRivalriesTicker rivalries={rivalries} />);
    expect(screen.getAllByText(longName).length).toBeGreaterThanOrEqual(1);
  });

  it('renders 500 items to completion and all entries appear in the DOM', () => {
    const rivalries = makeRivalries(500);
    expect(() => render(<TopRivalriesTicker rivalries={rivalries} />)).not.toThrow();
    // Verify sampling of first and last items to confirm the full list rendered.
    expect(screen.getAllByText('user-a-0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('user-a-499').length).toBeGreaterThanOrEqual(1);
  });

  it('handles rivalry labels with extreme numeric strings and unicode without crashing', () => {
    const extremeRivalries: RivalryItem[] = [
      {
        u1: 'alpha',
        u2: 'beta',
        label: '999,999,999 contributions',
        icon: MockIcon,
        color: 'text-rose-500',
      },
      {
        u1: 'gamma',
        u2: 'delta',
        label: '∞ unlimited 🔥'.repeat(20),
        icon: MockIcon,
        color: 'text-emerald-500',
      },
      {
        u1: 'epsilon',
        u2: 'zeta',
        label: '0'.repeat(1000),
        icon: MockIcon,
        color: 'text-yellow-400',
      },
    ];
    expect(() => render(<TopRivalriesTicker rivalries={extremeRivalries} />)).not.toThrow();
    expect(screen.getAllByText('999,999,999 contributions').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('alpha').length).toBeGreaterThanOrEqual(1);
  });
});
