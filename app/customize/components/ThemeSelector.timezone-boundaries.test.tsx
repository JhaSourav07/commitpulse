import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ThemeSelector } from './ThemeSelector';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./ThemeQuickPresets', () => ({
  ThemeQuickPresets: () => <div data-testid="theme-quick-presets" />,
}));

const onThemeChange = vi.fn();

const timezones = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];

const originalTZ = process.env.TZ;

describe('ThemeSelector - Timezone Normalization & Calendar Data Boundary Alignment (Variation 8)', () => {
  afterEach(() => {
    process.env.TZ = originalTZ;
    vi.restoreAllMocks();
  });

  it('1. renders consistently across multiple timezones', () => {
    for (const tz of timezones) {
      process.env.TZ = tz;

      const { unmount } = render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByTestId('theme-quick-presets')).toBeInTheDocument();

      unmount();
    }
  });

  it('2. remains identical across calendar date boundaries', () => {
    vi.useFakeTimers();

    process.env.TZ = 'UTC';
    vi.setSystemTime(new Date('2026-12-31T23:59:59Z'));

    const { rerender } = render(<ThemeSelector theme="light" onThemeChange={onThemeChange} />);

    vi.setSystemTime(new Date('2027-01-01T00:00:01Z'));

    rerender(<ThemeSelector theme="light" onThemeChange={onThemeChange} />);

    expect(screen.getByRole('combobox')).toHaveValue('light');

    vi.useRealTimers();
  });

  it('3. renders correctly during leap-year dates', () => {
    vi.useFakeTimers();

    process.env.TZ = 'UTC';
    vi.setSystemTime(new Date('2028-02-29T12:00:00Z'));

    render(<ThemeSelector theme="ocean" onThemeChange={onThemeChange} />);

    expect(screen.getByRole('combobox')).toHaveValue('ocean');

    vi.useRealTimers();
  });

  it('4. preserves locale-independent styling across timezone changes', () => {
    process.env.TZ = 'Asia/Kolkata';

    const { container } = render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('flex-col');
  });

  it('5. preserves rendered content across daylight-saving style transitions', () => {
    vi.useFakeTimers();

    process.env.TZ = 'America/New_York';
    vi.setSystemTime(new Date('2026-03-08T01:59:59'));

    const { rerender } = render(<ThemeSelector theme="neon" onThemeChange={onThemeChange} />);

    vi.setSystemTime(new Date('2026-03-08T03:00:01'));

    rerender(<ThemeSelector theme="neon" onThemeChange={onThemeChange} />);

    expect(screen.getByRole('combobox')).toHaveValue('neon');

    vi.useRealTimers();
  });
});
