import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Achievements from './Achievements';
import type { Achievement } from '@/types/dashboard';

/** IntersectionObserver must be a constructable class for framer-motion whileInView. */
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe = vi.fn((target: Element) => {
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
  });

  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

const baseAchievements: Achievement[] = [
  {
    id: '1',
    title: 'First PR',
    description: 'Opened your first pull request',
    icon: 'Sparkles',
    type: 'behavior',
    isUnlocked: true,
    progress: 100,
    currentValue: 1,
    threshold: 1,
  },
  {
    id: '2',
    title: '7 Day Streak',
    description: 'Committed 7 days in a row',
    icon: 'Flame',
    type: 'streak',
    isUnlocked: false,
    progress: 40,
    currentValue: 3,
    threshold: 7,
  },
];

const extendedAchievements: Achievement[] = [
  ...baseAchievements,
  {
    id: '3',
    title: 'Expert',
    description: 'Reached expert level',
    icon: 'Trophy',
    type: 'contributions',
    isUnlocked: true,
    progress: 100,
    currentValue: 1,
    threshold: 1,
  },
  {
    id: '4',
    title: 'Contributor',
    description: 'Made 10 contributions',
    icon: 'Sparkles',
    type: 'behavior',
    isUnlocked: false,
    progress: 50,
    currentValue: 5,
    threshold: 10,
  },
  {
    id: '5',
    title: 'Dedicated',
    description: '30 day streak',
    icon: 'Flame',
    type: 'streak',
    isUnlocked: false,
    progress: 30,
    currentValue: 9,
    threshold: 30,
  },
];

/** Walk up from a text node to the achievement card wrapper. */
function findAchievementCard(title: string, classFragment: string): HTMLElement {
  let el: HTMLElement | null = screen.getByText(title);
  while (el && !el.className.includes(classFragment)) {
    el = el.parentElement;
  }
  if (!el) {
    throw new Error(`Could not find achievement card for "${title}" with "${classFragment}"`);
  }
  return el;
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

describe('Achievements — mouse interactivity', () => {
  it('renders unlocked achievements with hover visual feedback and default cursor', () => {
    render(<Achievements achievements={baseAchievements} />);

    expect(screen.getByText('First PR')).toBeInTheDocument();

    const unlockedCard = findAchievementCard('First PR', 'cursor-default');
    expect(unlockedCard.className).toContain('cursor-default');
    expect(unlockedCard.className).toContain('hover:border-[rgba(255,255,255,0.16)]');
    expect(unlockedCard.className).toContain('hover:bg-gray-200');
    expect(unlockedCard.className).not.toContain('pointer-events-none');
  });

  it('applies pointer-events-none to locked achievements so they cannot receive clicks', async () => {
    const user = userEvent.setup();
    render(<Achievements achievements={baseAchievements} />);

    const lockedCard = findAchievementCard('7 Day Streak', 'pointer-events-none');
    expect(lockedCard.className).toContain('pointer-events-none');
    expect(lockedCard.className).toContain('opacity-30');
    expect(lockedCard.className).toContain('grayscale');

    await user.click(lockedCard);
    // Locked cards block interaction; progress text remains unchanged (no toggle side effect)
    expect(screen.getByText('3/7')).toBeInTheDocument();
  });

  it('shows the See All Achievements button when more than four achievements exist', () => {
    render(<Achievements achievements={extendedAchievements} />);

    expect(screen.getByText('See All Achievements')).toBeInTheDocument();
    expect(screen.getByText('First PR')).toBeInTheDocument();
    expect(screen.queryByText('Dedicated')).toBeNull();
  });

  it('toggles between See All Achievements and Show Less when the button is clicked', async () => {
    const user = userEvent.setup();
    render(<Achievements achievements={extendedAchievements} />);

    const toggleButton = screen.getByRole('button', { name: /see all achievements/i });
    expect(screen.queryByText('Dedicated')).toBeNull();

    await user.click(toggleButton);
    expect(screen.getByText('Show Less')).toBeInTheDocument();
    expect(screen.getByText('Dedicated')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show less/i }));
    expect(screen.getByText('See All Achievements')).toBeInTheDocument();
    expect(screen.queryByText('Dedicated')).toBeNull();
  });

  it('styles the toggle button with pointer cursor and hover utility classes', () => {
    render(<Achievements achievements={extendedAchievements} />);

    const toggleButton = screen.getByRole('button', { name: /see all achievements/i });
    expect(toggleButton.className).toContain('cursor-pointer');
    expect(toggleButton.className).toContain('hover:bg-zinc-800');
    expect(toggleButton.className).toContain('hover:opacity-90');
    expect(toggleButton.className).toContain('hover:scale-[1.02]');
    expect(toggleButton.className).toContain('hover:shadow-md');
  });
});
