import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeSelector } from './ThemeSelector';
import React from 'react';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./SectionLabel', () => ({
  SectionLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
}));

vi.mock('./ThemeQuickPresets', () => ({
  ThemeQuickPresets: () => <div data-testid="theme-quick-presets">ThemeQuickPresets</div>,
}));

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  window.dispatchEvent(new Event('resize'));
}

describe('ThemeSelector Responsive Breakpoints', () => {
  const onThemeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly on a mobile viewport (375px)', () => {
    setViewport(375);

    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByTestId('theme-quick-presets')).toBeInTheDocument();
  });

  it('uses responsive flex layout instead of fixed widths', () => {
    const { container } = render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('flex-col');
    expect(wrapper.className).not.toContain('w-screen');
    expect(wrapper.className).not.toContain('min-w');
  });

  it('does not use fixed width styling on the select element', () => {
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    const select = screen.getByRole('combobox');

    expect(select.className).toContain('w-full');
    expect(select.className).not.toContain('w-[400px]');
    expect(select.className).not.toContain('min-w');
  });

  it('allows theme selection on mobile', () => {
    setViewport(375);

    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'light' },
    });

    expect(onThemeChange).toHaveBeenCalledWith('light');
  });

  it('shuffle button remains functional after viewport resize', () => {
    setViewport(375);

    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    fireEvent.click(screen.getByRole('button', { name: /shuffle/i }));

    expect(onThemeChange).toHaveBeenCalledTimes(1);
  });
});
