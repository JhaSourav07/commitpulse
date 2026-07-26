import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ImgHTMLAttributes } from 'react';
import Leaderboard from './Leaderboard';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
    /* eslint-disable @next/next/no-img-element */
    <img alt="" {...props} />
  ),
}));

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

describe('Leaderboard accessibility behavior', () => {
  const contributors = [
    {
      id: 1,
      login: 'alice',
      avatar_url: 'https://example.com/alice.png',
      contributions: 100,
      html_url: 'https://github.com/alice',
    },
    {
      id: 2,
      login: 'bob',
      avatar_url: 'https://example.com/bob.png',
      contributions: 90,
      html_url: 'https://github.com/bob',
    },
    {
      id: 3,
      login: 'charlie',
      avatar_url: 'https://example.com/charlie.png',
      contributions: 80,
      html_url: 'https://github.com/charlie',
    },
    {
      id: 4,
      login: 'david',
      avatar_url: 'https://example.com/david.png',
      contributions: 70,
      html_url: 'https://github.com/david',
    },
  ];

  const renderLeaderboard = () => render(<Leaderboard contributors={contributors} />);

  it('renders contributor names for screen readers', () => {
    renderLeaderboard();

    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
    expect(screen.getByText('charlie')).toBeTruthy();
    expect(screen.getByText('david')).toBeTruthy();
  });

  it('provides accessible avatar alt text', () => {
    renderLeaderboard();

    expect(screen.getByAltText('alice')).toBeInTheDocument();
    expect(screen.getByAltText('bob')).toBeInTheDocument();
  });

  it('exposes interactive leaderboard entries as buttons', () => {
    renderLeaderboard();

    const buttons = screen.getAllByRole('button');

    expect(buttons.length).toBeGreaterThan(0);
  });

  it('allows keyboard focus on interactive leaderboard entries', () => {
    renderLeaderboard();

    const buttons = screen.getAllByRole('button');

    buttons[0].focus();

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('displays contribution counts in accessible text content', () => {
    renderLeaderboard();

    expect(screen.getByText('70')).toBeInTheDocument();
  });
});
