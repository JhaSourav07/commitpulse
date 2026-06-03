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

describe('DiscordButton accessibility behavior', () => {
  it('renders as an accessible link with visible text', () => {
    render(<DiscordButton />);

    expect(screen.getByRole('link', { name: /join the core community on discord/i })).toBeDefined();
  });

  it('uses the correct Discord invite href', () => {
    render(<DiscordButton />);

    expect(screen.getByRole('link').getAttribute('href')).toBe('https://discord.gg/Cb73bS79j');
  });

  it('opens external Discord link safely in a new tab', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');

    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('is keyboard focusable through the anchor element', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');
    link.focus();

    expect(document.activeElement).toBe(link);
  });

  it('keeps only one accessible link target for screen readers', () => {
    render(<DiscordButton />);

    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
