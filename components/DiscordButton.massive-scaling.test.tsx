import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ReactNode, HTMLAttributes, AnchorHTMLAttributes } from 'react';
import { DiscordButton } from './DiscordButton';

const massiveLabel = 'Discord Community '.repeat(1000);

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: vi.fn(() => massiveLabel),
  }),
}));

type MockDivProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

type MockAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: ReactNode;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockDivProps) => <div {...props}>{children}</div>,
    a: ({ children, ...props }: MockAnchorProps) => <a {...props}>{children}</a>,
  },
}));

vi.mock('gsap', () => ({
  default: {
    to: vi.fn(),
  },
}));

describe('DiscordButton Massive Scaling', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders extremely large translated content without crashing', () => {
    render(<DiscordButton />);

    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('supports repeated renders under heavy load', () => {
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<DiscordButton />);

      expect(screen.getByRole('link')).toBeInTheDocument();

      unmount();
    }
  });

  it('maintains valid Discord invite link with huge content', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('href', 'https://discord.gg/f84SDraEBH');
  });

  it('handles hover interactions with massive content', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');

    fireEvent.mouseEnter(link);
    fireEvent.mouseMove(link);

    expect(link).toBeInTheDocument();
  });

  it('renders SVG elements correctly under scaling conditions', () => {
    const { container } = render(<DiscordButton />);

    const svgs = container.querySelectorAll('svg');

    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });
});
