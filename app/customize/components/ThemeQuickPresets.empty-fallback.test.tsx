import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { ThemeQuickPresets } from './ThemeQuickPresets';

describe('ThemeQuickPresets Edge Cases & Empty/Missing Inputs Verification', () => {
  it('renders successfully with an unknown theme value', () => {
    expect(() =>
      render(<ThemeQuickPresets theme="unknown-theme" onThemeChange={vi.fn()} />)
    ).not.toThrow();

    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('renders preset buttons while no active theme matches', () => {
    render(<ThemeQuickPresets theme="missing-theme" onThemeChange={vi.fn()} />);

    const activeButtons = screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-pressed') === 'true');

    expect(activeButtons).toHaveLength(0);
  });

  it('maintains default layout structure when active indicators are absent', () => {
    const { container } = render(
      <ThemeQuickPresets theme="invalid-theme" onThemeChange={vi.fn()} />
    );

    const wrapper = container.querySelector('.theme-quick-presets');

    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.children.length).toBeGreaterThan(0);

    expect(container.querySelector('.tqp-ring')).toBeNull();
    expect(container.querySelector('.tqp-dot')).toBeNull();
  });

  it('renders buttons with fallback styling and accessible labels', () => {
    render(<ThemeQuickPresets theme="not-configured" onThemeChange={vi.fn()} />);

    const buttons = screen.getAllByRole('button');

    expect(buttons.length).toBeGreaterThan(0);

    buttons.forEach((button) => {
      expect(button).toHaveClass('tqp-btn');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('style');
    });
  });

  it('renders theme preview icons and structural markers without runtime failures', () => {
    const { container } = render(<ThemeQuickPresets theme="" onThemeChange={vi.fn()} />);

    const svgs = container.querySelectorAll('svg');

    expect(svgs.length).toBeGreaterThan(0);

    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    expect(container.querySelector('.theme-quick-presets')).toBeInTheDocument();
  });
});
