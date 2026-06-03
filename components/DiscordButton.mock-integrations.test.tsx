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

describe('DiscordButton - mock integrations', () => {
  it('renders integration link correctly', () => {
    render(<DiscordButton />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('displays integration CTA', () => {
    render(<DiscordButton />);
    expect(screen.getByText(/Join the core community on Discord/i)).toBeInTheDocument();
  });

  it('renders with integration svgs', () => {
    const { container } = render(<DiscordButton />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('targets external integration properly', () => {
    render(<DiscordButton />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('points to correct integration discord url', () => {
    render(<DiscordButton />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://discord.gg/Cb73bS79j');
  });
});
