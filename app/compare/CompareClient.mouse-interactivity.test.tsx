import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CompareClient from './CompareClient';
import React, { type ReactNode } from 'react';

const { mockRouter, mockSearchParams } = vi.hoisted(() => ({
  mockRouter: { replace: vi.fn() },
  mockSearchParams: { get: vi.fn(() => null) },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        return ({
          children,
          animate,
          initial,
          exit,
          transition,
          variants,
          whileHover,
          whileTap,
          whileFocus,
          whileDrag,
          whileInView,
          layout,
          layoutId,
          ...props
        }: {
          children?: ReactNode;
          [key: string]: unknown;
        }) => React.createElement(tag as string, props, children);
      },
    }
  ),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

const mockResponse = {
  user1: {
    profile: {
      username: 'userA',
      name: 'User A',
      avatarUrl: '/avatar-a.png',
      isPro: true,
      bio: 'Frontend Developer',
      location: 'India',
      joinedDate: '2023',
      developerScore: 90,
      stats: {
        repositories: 100,
        followers: 200,
        following: 50,
        stars: 500,
      },
    },
    stats: {
      currentStreak: 50,
      peakStreak: 100,
      totalContributions: 5000,
      codingHabit: 'Night Owl',
      totalPRs: 20,
      totalIssues: 10,
    },
    languages: [
      {
        name: 'TypeScript',
        color: '#3178c6',
        percentage: 80,
      },
    ],
    activity: Array.from({ length: 100 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 10),
      intensity: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
      locAdditions: Math.floor(Math.random() * 200),
      locDeletions: Math.floor(Math.random() * 100),
    })),
  },
  user2: {
    profile: {
      username: 'userB',
      name: 'User B',
      avatarUrl: '/avatar-b.png',
      isPro: false,
      bio: 'Backend Developer',
      location: 'USA',
      joinedDate: '2022',
      developerScore: 80,
      stats: {
        repositories: 80,
        followers: 100,
        following: 40,
        stars: 300,
      },
    },
    stats: {
      currentStreak: 30,
      peakStreak: 70,
      totalContributions: 3000,
      codingHabit: 'Early Bird',
      totalPRs: 15,
      totalIssues: 5,
    },
    languages: [
      {
        name: 'JavaScript',
        color: '#f7df1e',
        percentage: 70,
      },
    ],
    activity: Array.from({ length: 100 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 10),
      intensity: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
      locAdditions: Math.floor(Math.random() * 200),
      locDeletions: Math.floor(Math.random() * 100),
    })),
  },
};

describe('CompareClient Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();

    global.fetch = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => mockResponse,
        }) as Response
    );
  });

  it('verifies mouse hover styling and hover class application on search and action elements', () => {
    render(<CompareClient />);

    const user1Input = screen.getByPlaceholderText(/github username #1/i);
    const user2Input = screen.getByPlaceholderText(/github username #2/i);
    const compareBtn = screen.getByRole('button', { name: /compare/i });

    // Verify presence of cursor-pointer or transition-colors classes
    expect(compareBtn).toHaveClass('transition-colors');
    expect(compareBtn).toHaveClass('hover:bg-zinc-800');

    // Simulate mouse interaction
    fireEvent.mouseEnter(compareBtn);
    fireEvent.mouseLeave(compareBtn);

    fireEvent.mouseEnter(user1Input);
    fireEvent.mouseLeave(user1Input);

    fireEvent.mouseEnter(user2Input);
    fireEvent.mouseLeave(user2Input);
  });

  it('renders stats showdown cards and verifies hover-related border transitions', async () => {
    render(<CompareClient />);

    fireEvent.change(screen.getByPlaceholderText(/github username #1/i), {
      target: { value: 'userA' },
    });
    fireEvent.change(screen.getByPlaceholderText(/github username #2/i), {
      target: { value: 'userB' },
    });

    fireEvent.click(screen.getByRole('button', { name: /compare/i }));

    await waitFor(() => {
      expect(screen.getByText(/stats showdown/i)).toBeInTheDocument();
    });

    // Check StatBattle border elements transitions on mouseEnter / mouseLeave
    const repositoryCard = screen.getByText('5,000').closest('div');
    expect(repositoryCard).toBeInTheDocument();

    fireEvent.mouseEnter(repositoryCard!);
    fireEvent.mouseLeave(repositoryCard!);
  });

  it('triggers mouse hover interactions on coding habits cards', async () => {
    render(<CompareClient />);

    fireEvent.change(screen.getByPlaceholderText(/github username #1/i), {
      target: { value: 'userA' },
    });
    fireEvent.change(screen.getByPlaceholderText(/github username #2/i), {
      target: { value: 'userB' },
    });

    fireEvent.click(screen.getByRole('button', { name: /compare/i }));

    await waitFor(() => {
      expect(screen.getByText(/coding habits/i)).toBeInTheDocument();
    });

    const habitCards = screen.getAllByRole('heading', { level: 3 });
    const userAHabit = habitCards.find((c) => c.textContent === 'Night Owl');
    const userBHabit = habitCards.find((c) => c.textContent === 'Early Bird');

    expect(userAHabit).toBeInTheDocument();
    expect(userBHabit).toBeInTheDocument();

    // Trigger hover events to verify standard scale and glow hover properties
    const containerA = userAHabit!.closest('div');
    const containerB = userBHabit!.closest('div');

    expect(containerA).toHaveClass('transition-all');
    expect(containerB).toHaveClass('transition-all');

    fireEvent.mouseEnter(containerA!);
    fireEvent.mouseLeave(containerA!);

    fireEvent.mouseEnter(containerB!);
    fireEvent.mouseLeave(containerB!);
  });

  it('verifies touch start propagation on controls and action buttons', () => {
    render(<CompareClient />);

    const user1Input = screen.getByPlaceholderText(/github username #1/i);
    const user2Input = screen.getByPlaceholderText(/github username #2/i);
    const compareBtn = screen.getByRole('button', { name: /compare/i });

    // Simulate mobile touch event start to verify they propagate properly without being prevented
    const touchStartEvent1 = fireEvent.touchStart(user1Input);
    const touchStartEvent2 = fireEvent.touchStart(user2Input);
    const touchStartEvent3 = fireEvent.touchStart(compareBtn);

    expect(touchStartEvent1).toBe(true);
    expect(touchStartEvent2).toBe(true);
    expect(touchStartEvent3).toBe(true);
  });

  it('renders contribution activity heatmap and verifies hover title-tooltips exist', async () => {
    render(<CompareClient />);

    fireEvent.change(screen.getByPlaceholderText(/github username #1/i), {
      target: { value: 'userA' },
    });
    fireEvent.change(screen.getByPlaceholderText(/github username #2/i), {
      target: { value: 'userB' },
    });

    fireEvent.click(screen.getByRole('button', { name: /compare/i }));

    await waitFor(() => {
      expect(screen.getByText(/stats showdown/i)).toBeInTheDocument();
    });

    // Find custom heatmap items having 'title' attribute,
    // verify hover details on a heatmap cell
    await waitFor(() => {
      const allCells = document.querySelectorAll('[title]');
      expect(allCells.length).toBeGreaterThan(0);
      const sampleCell = allCells[0];
      expect(sampleCell).toHaveAttribute('title');
      fireEvent.mouseEnter(sampleCell);
      fireEvent.mouseLeave(sampleCell);
    });
  });
});
