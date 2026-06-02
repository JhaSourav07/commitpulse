import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { DiscordButton } from './DiscordButton';
// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: React.ComponentProps<'div'>) => <div {...props} />,
    a: (props: React.ComponentProps<'a'>) => <a {...props} />,
  },
}));

// Mock gsap

vi.mock('gsap', () => ({
  default: {
    to: vi.fn(),
  },
}));

describe('DiscordButton', () => {
  it('renders discord invite link with correct href', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('href', 'https://discord.gg/Cb73bS79j');
  });

  it('sets target and rel attributes for security', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders discord call-to-action text', () => {
    render(<DiscordButton />);

    expect(screen.getByText('Join the core community on Discord')).toBeInTheDocument();
  });

  it('renders svg icons', () => {
    const { container } = render(<DiscordButton />);

    const svgs = container.querySelectorAll('svg');

    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders external link target', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('target', '_blank');
  });
});
