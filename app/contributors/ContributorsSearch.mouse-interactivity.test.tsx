import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContributorsSearch from './ContributorsSearch';

const mockContributors = [
  {
    id: 1,
    login: 'alice',
    avatar_url: 'https://example.com/alice.png',
    contributions: 42,
    html_url: 'https://github.com/alice',
  },
  {
    id: 2,
    login: 'bob',
    avatar_url: 'https://example.com/bob.png',
    contributions: 17,
    html_url: 'https://github.com/bob',
  },
];

describe('ContributorsSearch Mouse Interactivity', () => {
  it('renders contributor cards for interaction', () => {
    render(<ContributorsSearch contributors={mockContributors} />);

    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
  });

  it('handles mouse movement over contributor card', () => {
    render(<ContributorsSearch contributors={mockContributors} />);

    const contributorCard = screen.getByText('alice');

    fireEvent.mouseMove(contributorCard, {
      clientX: 100,
      clientY: 50,
    });

    expect(screen.getByText('alice')).toBeTruthy();
  });

  it('handles multiple mouse move events without crashing', () => {
    const { container } = render(<ContributorsSearch contributors={mockContributors} />);

    const glareCard = container.querySelector('.h-full');

    fireEvent.mouseMove(glareCard as HTMLElement, {
      clientX: 10,
      clientY: 20,
    });

    fireEvent.mouseMove(glareCard as HTMLElement, {
      clientX: 50,
      clientY: 60,
    });

    fireEvent.mouseMove(glareCard as HTMLElement, {
      clientX: 120,
      clientY: 80,
    });

    expect(screen.getByText('alice')).toBeTruthy();
  });

  it('keeps contributor content visible after hover interaction', () => {
    const { container } = render(<ContributorsSearch contributors={mockContributors} />);

    const glareCard = container.querySelector('.h-full');

    fireEvent.mouseMove(glareCard as HTMLElement, {
      clientX: 75,
      clientY: 75,
    });

    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
  });

  it('supports mouse interaction on all rendered cards', () => {
    const { container } = render(<ContributorsSearch contributors={mockContributors} />);

    const cards = container.querySelectorAll('.h-full');

    cards.forEach((card) => {
      fireEvent.mouseMove(card as HTMLElement, {
        clientX: 40,
        clientY: 40,
      });
    });

    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
  });
});
