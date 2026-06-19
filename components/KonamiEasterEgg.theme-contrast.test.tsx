import { fireEvent, render, screen } from '@testing-library/react';
import React, { type HTMLAttributes, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import KonamiEasterEgg from './KonamiEasterEgg';

type MotionProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
};

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) => {
        return ({ children, ...props }: MotionProps) => React.createElement(tag, props, children);
      },
    }
  ),
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('KonamiEasterEgg theme contrast', () => {
  const triggerEasterEgg = () => {
    'commit'.split('').forEach((key) => {
      fireEvent.keyDown(window, { key });
    });
  };

  it('renders dark-theme overlay with sufficient contrast styling', () => {
    document.documentElement.classList.add('dark');

    render(<KonamiEasterEgg />);
    triggerEasterEgg();

    expect(screen.getByText('You Found It!')).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('renders correctly in light theme environments', () => {
    document.documentElement.classList.remove('dark');

    render(<KonamiEasterEgg />);
    triggerEasterEgg();

    expect(screen.getByText('You Found It!')).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('displays foreground content without clipping through backdrop overlay', () => {
    const { container } = render(<KonamiEasterEgg />);
    triggerEasterEgg();

    expect(screen.getByText('You Found It!')).toBeVisible();
    expect(container.textContent).toContain('git commit -m');
    expect(container.textContent).toContain('unlocked_easter_egg');
  });

  it('renders contrast-oriented emerald visual styling elements', () => {
    const { container } = render(<KonamiEasterEgg />);
    triggerEasterEgg();

    expect(container.querySelector('.border-emerald-500\\/30')).toBeInTheDocument();

    expect(container.querySelector('.text-emerald-300\\/70')).toBeInTheDocument();
  });

  it('renders gradient and accent elements used for visual cohesion', () => {
    const { container } = render(<KonamiEasterEgg />);
    triggerEasterEgg();

    expect(container.querySelector('.bg-gradient-to-r')).toBeInTheDocument();

    expect(container.querySelector('.text-emerald-500')).toBeInTheDocument();
  });
});
