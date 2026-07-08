import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { ThemeQuickPresets } from './ThemeQuickPresets';
import { THEME_KEYS } from '../types';

describe('ThemeQuickPresets - timezone boundaries', () => {
  const originalTZ = process.env.TZ;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.TZ = originalTZ;
    cleanup();
  });

  const timezones = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];

  it.each(timezones)('renders consistently in timezone %s', (timezone) => {
    process.env.TZ = timezone;

    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);

    const expectedButtons = THEME_KEYS.filter((key) => key !== 'auto' && key !== 'random');

    expect(screen.getAllByRole('button')).toHaveLength(expectedButtons.length);

    expectedButtons.forEach((key) => {
      expect(
        screen.getByRole('button', {
          name: new RegExp(`Apply ${key} theme`, 'i'),
        })
      ).toBeInTheDocument();
    });
  });

  it.each(timezones)('active theme remains identical in %s', (timezone) => {
    process.env.TZ = timezone;

    render(<ThemeQuickPresets theme="neon" onThemeChange={vi.fn()} />);

    expect(
      screen.getByRole('button', {
        name: /Apply neon theme/i,
      })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it.each(timezones)('theme selection callback is unaffected in %s', (timezone) => {
    process.env.TZ = timezone;

    const onThemeChange = vi.fn();

    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: /Apply light theme/i,
      })
    );

    expect(onThemeChange).toHaveBeenCalledTimes(1);
    expect(onThemeChange).toHaveBeenCalledWith('light');
  });

  it('renders identical markup across timezone changes', () => {
    process.env.TZ = 'UTC';

    const utc = render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />).container
      .innerHTML;

    cleanup();

    process.env.TZ = 'Asia/Kolkata';

    const ist = render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />).container
      .innerHTML;

    expect(utc).toEqual(ist);
  });

  it('timezone transitions do not alter available presets', () => {
    const expected = THEME_KEYS.filter((key) => key !== 'auto' && key !== 'random').length;

    for (const tz of timezones) {
      cleanup();
      process.env.TZ = tz;

      render(<ThemeQuickPresets theme="github" onThemeChange={vi.fn()} />);

      expect(screen.getAllByRole('button')).toHaveLength(expected);
    }
  });
});
