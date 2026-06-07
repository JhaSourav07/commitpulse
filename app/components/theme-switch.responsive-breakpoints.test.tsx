import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, afterEach, vi } from 'vitest';

import { ThemeToggleButton, createAnimation } from './theme-switch';
let originalMatchMedia: typeof window.matchMedia;

beforeEach(() => {
  originalMatchMedia = window.matchMedia;

  Object.defineProperty(window, 'innerWidth', {
    value: 375,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }),
  });
});

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  });
});
describe('ThemeSwitch responsive breakpoint behavior', () => {
  it('renders correctly on a standard 375px mobile viewport', () => {
    render(<ThemeToggleButton />);

    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('uses compact dimensions suitable for narrow viewport layouts', () => {
    render(<ThemeToggleButton />);

    const button = screen.getByRole('button', {
      name: /toggle theme/i,
    });

    expect(button.className).toContain('h-10');
    expect(button.className).toContain('w-10');
  });

  it('preserves accessibility labels at mobile breakpoint widths', () => {
    render(<ThemeToggleButton />);

    const button = screen.getByRole('button', {
      name: /toggle theme/i,
    });

    expect(button).toHaveAttribute('aria-label', 'Toggle theme');
  });

  it('supports toggle interaction on mobile-sized viewports', () => {
    render(<ThemeToggleButton />);

    const button = screen.getByRole('button', {
      name: /toggle theme/i,
    });

    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('generates animation output that remains bounded for responsive layouts', () => {
    const animation = createAnimation('circle', 'top-right');

    expect(animation.name).toContain('circle');
    expect(animation.css.length).toBeGreaterThan(0);
  });
});
