/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import DeveloperArena from './DeveloperArena';
import React from 'react';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" {...props} />;
  },
}));

describe('DeveloperArena', () => {
  it('renders correctly with sections and headings', () => {
    const handleSelectBattle = vi.fn();
    render(<DeveloperArena onSelectBattle={handleSelectBattle} />);

    expect(screen.getByText('Developer Battleground')).toBeInTheDocument();
    expect(screen.getByText('Step Into the Esports Arena')).toBeInTheDocument();
    expect(screen.getByText('Trending Showdowns')).toBeInTheDocument();
    expect(screen.getByText('Guess The Developer')).toBeInTheDocument();
    expect(screen.getByText('AI Showdown Predictions')).toBeInTheDocument();
    expect(screen.getByText('GitHub Legends Walk of Fame')).toBeInTheDocument();
  });

  it('triggers onSelectBattle when a trending showdown is clicked', () => {
    const handleSelectBattle = vi.fn();
    render(<DeveloperArena onSelectBattle={handleSelectBattle} />);

    // Get a trending showdown card, e.g., React vs Svelte match gaearon/rich-harris
    // There are multiple matching elements because of the infinite duplicate marquee layout, select one.
    const showdownCards = screen.getAllByText('React vs Svelte');
    expect(showdownCards.length).toBeGreaterThan(0);

    fireEvent.click(showdownCards[0]);
    expect(handleSelectBattle).toHaveBeenCalledWith('gaearon', 'rich-harris');
  });

  it('reveals the developer in the trivia game when Reveal button is clicked', async () => {
    const handleSelectBattle = vi.fn();
    render(<DeveloperArena onSelectBattle={handleSelectBattle} />);

    // Initially, the unique biography should not be visible in text
    expect(
      screen.queryByText('React core team alumnus, creator of Redux and Create React App.')
    ).not.toBeInTheDocument();

    const revealButton = screen.getByRole('button', { name: /reveal developer/i });
    fireEvent.click(revealButton);

    // The biography of the current challenge should be revealed
    await waitFor(() => {
      expect(
        screen.getByText('React core team alumnus, creator of Redux and Create React App.')
      ).toBeInTheDocument();
    });
  });

  it('triggers correct challenge action when Challenge Linus is clicked after reveal', async () => {
    const handleSelectBattle = vi.fn();
    render(<DeveloperArena onSelectBattle={handleSelectBattle} />);

    const revealButton = screen.getByRole('button', { name: /reveal developer/i });
    fireEvent.click(revealButton);

    const challengeButton = await screen.findByRole('button', { name: /challenge linus/i });
    fireEvent.click(challengeButton);

    expect(handleSelectBattle).toHaveBeenCalledWith('gaearon', 'torvalds');
  });

  it('allows skipping a trivia game challenge', async () => {
    const handleSelectBattle = vi.fn();
    render(<DeveloperArena onSelectBattle={handleSelectBattle} />);

    // First challenge hint contains "Creator of Redux"
    expect(screen.getByText(/Creator of Redux/i)).toBeInTheDocument();

    const skipButton = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipButton);

    // Second challenge is Evan You, which contains "Creator of Vue.js"
    await waitFor(() => {
      expect(screen.getByText(/Creator of Vue.js/i)).toBeInTheDocument();
    });
  });
});
