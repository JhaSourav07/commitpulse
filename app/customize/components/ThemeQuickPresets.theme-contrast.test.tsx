import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ThemeQuickPresets } from './ThemeQuickPresets';

describe('ThemeQuickPresets Theme Contrast', () => {
  it('renders dark theme preset button', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);

    expect(
      screen.getByRole('button', {
        name: /apply dark theme/i,
      })
    ).toBeInTheDocument();
  });

  it('renders light theme preset button', () => {
    render(<ThemeQuickPresets theme="light" onThemeChange={vi.fn()} />);

    expect(
      screen.getByRole('button', {
        name: /apply light theme/i,
      })
    ).toBeInTheDocument();
  });

  it('marks active theme with aria-pressed=true', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);

    expect(
      screen.getByRole('button', {
        name: /apply dark theme/i,
      })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies theme change when preset is clicked', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();

    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    await user.click(
      screen.getByRole('button', {
        name: /apply light theme/i,
      })
    );

    expect(onThemeChange).toHaveBeenCalledWith('light');
  });

  it('renders preset buttons with theme styling', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);

    const button = screen.getByRole('button', {
      name: /apply dark theme/i,
    });

    expect(button).toHaveAttribute('style', expect.stringContaining('linear-gradient'));
  });
});
