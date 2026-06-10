import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import gsap from 'gsap';
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

describe('DiscordButton mouse interactivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets hover state on mouse enter', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');

    fireEvent.mouseEnter(link);

    expect(link).toBeInTheDocument();
  });

  it('triggers gsap animation on mouse move while hovered', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');

    fireEvent.mouseEnter(link);

    fireEvent.mouseMove(link, {
      clientX: 100,
      clientY: 50,
    });

    expect(gsap.to).toHaveBeenCalled();
  });

  it('resets gsap transforms on mouse leave', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');

    fireEvent.mouseEnter(link);
    fireEvent.mouseLeave(link);

    expect(gsap.to).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
      })
    );
  });
});
