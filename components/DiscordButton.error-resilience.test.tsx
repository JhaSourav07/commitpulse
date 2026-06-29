import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DiscordButton } from './DiscordButton';

vi.mock('gsap', () => ({
  default: {
    to: vi.fn(),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    a: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a {...props}>{children}</a>
    ),
  },
}));

describe('DiscordButton error resilience', () => {
  it('renders without crashing', () => {
    render(<DiscordButton />);

    expect(screen.getByText(/join the core community on discord/i)).toBeTruthy();
  });

  it('renders the discord link even when animations are mocked', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');

    expect(link).toBeTruthy();
  });

  it('contains a valid discord invite url', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');

    expect(link.getAttribute('href')).toContain('discord.gg');
  });

  it('opens discord link securely in a new tab', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');

    expect(link.getAttribute('target')).toBe('_blank');

    const rel = link.getAttribute('rel') ?? '';

    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  it('keeps button content visible after render', () => {
    render(<DiscordButton />);

    expect(screen.getByText(/join the core community on discord/i)).toBeTruthy();
  });
});
