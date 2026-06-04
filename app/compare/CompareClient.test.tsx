import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CompareClient from './CompareClient';
import React, { type ReactNode } from 'react';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        return ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) =>
          React.createElement(tag as string, props, children);
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
      avatarUrl: 'avatar-a.png',
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
    },
    languages: [
      {
        name: 'TypeScript',
        color: '#3178c6',
        percentage: 80,
      },
    ],
    activity: [],
  },

  user2: {
    profile: {
      username: 'userB',
      name: 'User B',
      avatarUrl: 'avatar-b.png',
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
    },
    languages: [
      {
        name: 'JavaScript',
        color: '#f7df1e',
        percentage: 70,
      },
    ],
    activity: [],
  },
};

describe('CompareClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => mockResponse,
        }) as Response
    );
  });

  it('renders comparison page', () => {
    render(<CompareClient />);

    expect(
      screen.getByRole('heading', {
        name: /compare developers/i,
      })
    ).toBeInTheDocument();
  });

  it('allows usernames to be modified via controls', () => {
    render(<CompareClient />);

    const user1 = screen.getByPlaceholderText(/github username #1/i);
    const user2 = screen.getByPlaceholderText(/github username #2/i);

    fireEvent.change(user1, {
      target: { value: 'userA' },
    });

    fireEvent.change(user2, {
      target: { value: 'userB' },
    });

    expect(user1).toHaveValue('userA');
    expect(user2).toHaveValue('userB');
  });

  it('renders comparative scores correctly', async () => {
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

    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('3,000')).toBeInTheDocument();
  });

  it('updates route when compare button is clicked', async () => {
    render(<CompareClient />);

    fireEvent.change(screen.getByPlaceholderText(/github username #1/i), {
      target: { value: 'userA' },
    });

    fireEvent.change(screen.getByPlaceholderText(/github username #2/i), {
      target: { value: 'userB' },
    });

    fireEvent.click(screen.getByRole('button', { name: /compare/i }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/compare?user1=userA&user2=userB', {
        scroll: false,
      });
    });
  });

  it('shows error message when api request fails', async () => {
    global.fetch = vi.fn(
      async () =>
        ({
          ok: false,
          json: async () => ({
            error: 'Failed to fetch comparison data.',
          }),
        }) as Response
    );

    render(<CompareClient />);

    fireEvent.change(screen.getByPlaceholderText(/github username #1/i), {
      target: { value: 'userA' },
    });

    fireEvent.change(screen.getByPlaceholderText(/github username #2/i), {
      target: { value: 'userB' },
    });

    fireEvent.click(screen.getByRole('button', { name: /compare/i }));

    expect(await screen.findByText(/failed to fetch comparison data/i)).toBeInTheDocument();
  });
});
