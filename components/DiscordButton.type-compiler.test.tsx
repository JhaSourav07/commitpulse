/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { DiscordButton } from './DiscordButton';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ animate, initial, transition, whileTap, ...props }: any) => <div {...props} />,
    a: ({ animate, initial, transition, whileTap, ...props }: any) => <a {...props} />,
  },
}));

vi.mock('gsap', () => ({
  default: {
    to: vi.fn(),
  },
}));

describe('DiscordButton - type compiler', () => {
  it('compiles and renders without error', () => {
    render(<DiscordButton />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('compiles expected text content', () => {
    render(<DiscordButton />);
    expect(screen.getByText('Join the core community on Discord')).toBeInTheDocument();
  });

  it('compiles with svg support', () => {
    const { container } = render(<DiscordButton />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('compiles target attributes', () => {
    render(<DiscordButton />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('compiles valid href', () => {
    render(<DiscordButton />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://discord.gg/Cb73bS79j');
  });
});
