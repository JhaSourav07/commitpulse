import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DiscordButton } from './DiscordButton';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    a: ({ children, ...props }: React.HTMLAttributes<HTMLAnchorElement>) => (
      <a {...props}>{children}</a>
    ),
  },
}));

// Mock gsap
vi.mock('gsap', () => ({
  default: { to: vi.fn() },
}));

describe('DiscordButton - Edge Cases & Empty/Missing Inputs', () => {
  it('renders without crashing with no props', () => {
    const { container } = render(<DiscordButton />);
    expect(container).toBeTruthy();
  });

  it('renders a fallback anchor element in default state', () => {
    const { container } = render(<DiscordButton />);
    const anchor = container.querySelector('a');
    expect(anchor).toBeTruthy();
  });

  it('renders with correct Discord href in empty/default state', () => {
    const { container } = render(<DiscordButton />);
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://discord.gg/Cb73bS79j');
  });

  it('renders the join text in default empty layout state', () => {
    render(<DiscordButton />);
    expect(screen.getByText(/join the core community on discord/i)).toBeTruthy();
  });

  it('does not throw errors and maintains DOM structure', () => {
    expect(() => render(<DiscordButton />)).not.toThrow();
    const { container } = render(<DiscordButton />);
    expect(container.firstChild).toBeTruthy();
  });
});
