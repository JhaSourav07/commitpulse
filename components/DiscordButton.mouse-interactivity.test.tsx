import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { DiscordButton } from './DiscordButton';

vi.mock('gsap', () => ({
  default: { to: vi.fn() },
}));

vi.mock('framer-motion', () => {
  const cache: Record<string, React.ComponentType<Record<string, unknown>>> = {};

  const getOrCreate = (tag: string) => {
    if (!cache[tag]) {
      const Component = React.forwardRef(
        (
          {
            children,
            animate,
            initial,
            exit,
            transition,
            whileHover,
            whileTap,
            whileInView,
            viewport,
            ...props
          }: { children?: React.ReactNode; [key: string]: unknown },
          ref: React.ForwardedRef<unknown>
        ) => React.createElement(tag, { ...props, ref }, children)
      );
      Component.displayName = `motion.${tag}`;
      cache[tag] = Component as React.ComponentType<Record<string, unknown>>;
    }
    return cache[tag];
  };

  return {
    motion: new Proxy({}, { get: (_, tag: string) => getOrCreate(tag) }),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('DiscordButton - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  it('renders the anchor element with the correct Discord href and external link attributes', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://discord.gg/f84SDraEBH');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('fires mouseenter on the anchor without throwing and confirms the group class is present for hover transitions', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');
    expect(link).toHaveClass('group');
    expect(() => fireEvent.mouseEnter(link)).not.toThrow();

    // Re-query after state change — component stays mounted with stable ref
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('fires mouseleave on the anchor without throwing and confirms GSAP reset is attempted', async () => {
    const gsap = (await import('gsap')).default;

    render(<DiscordButton />);

    const link = screen.getByRole('link');
    fireEvent.mouseEnter(link);

    // Re-query after mouseEnter re-render — stable component means same DOM node
    const linkAfterHover = screen.getByRole('link');
    expect(() =>
      linkAfterHover.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    ).not.toThrow();

    // buttonRef is now properly forwarded via forwardRef — GSAP reset fires
    expect(gsap.to).toHaveBeenCalled();
  });

  it('propagates touch start and touch end events on the anchor without being prevented', () => {
    render(<DiscordButton />);

    const link = screen.getByRole('link');
    expect(fireEvent.touchStart(link)).toBe(true);
    expect(fireEvent.touchEnd(link)).toBe(true);
  });

  it('renders the hover sweep overlay with transition classes that control the slide-in animation on group hover', () => {
    const { container } = render(<DiscordButton />);

    const sweepOverlay = container.querySelector('.translate-y-\\[100\\%\\]');
    expect(sweepOverlay).toBeInTheDocument();
    expect(sweepOverlay).toHaveClass('group-hover:translate-y-0');
    expect(sweepOverlay).toHaveClass('transition-transform');
    expect(sweepOverlay).toHaveClass('absolute');
    expect(sweepOverlay).toHaveClass('inset-0');
  });
});
