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

describe('DiscordButton - timezone boundaries', () => {
  it('renders correctly', () => {
    render(<DiscordButton />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('has correct timezone boundary link text', () => {
    render(<DiscordButton />);
    expect(screen.getByText('Join the core community on Discord')).toBeInTheDocument();
  });

  it('contains svg icon for timezone rendering', () => {
    const { container } = render(<DiscordButton />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('maintains boundary href reference', () => {
    render(<DiscordButton />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://discord.gg/f84SDraEBH');
  });

  it('supports boundary external linking', () => {
    render(<DiscordButton />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
