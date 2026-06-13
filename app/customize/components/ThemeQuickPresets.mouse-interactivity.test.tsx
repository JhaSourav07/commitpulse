import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeQuickPresets } from './ThemeQuickPresets';

describe('ThemeQuickPresets mouse interactivity', () => {
  it('renders interactive theme buttons with tooltip titles', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);

    const darkButton = screen.getByRole('button', { name: /apply dark theme/i });

    expect(darkButton).toHaveAttribute('title', 'Dark');
    expect(darkButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('triggers theme change when a preset is clicked', () => {
    const onThemeChange = vi.fn();

    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    fireEvent.click(screen.getByRole('button', { name: /apply light theme/i }));

    expect(onThemeChange).toHaveBeenCalledTimes(1);
    expect(onThemeChange).toHaveBeenCalledWith('light');
  });

  it('keeps hoverable preset buttons styled with pointer cursor class support', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);

    const button = screen.getByRole('button', { name: /apply dark theme/i });

    fireEvent.mouseEnter(button);

    expect(button).toHaveClass('tqp-btn');
  });

  it('preserves active overlay visuals while hovering the selected preset', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);

    const button = screen.getByRole('button', { name: /apply dark theme/i });

    fireEvent.mouseEnter(button);

    expect(button.querySelector('.tqp-ring')).not.toBeNull();
    expect(button.querySelector('.tqp-dot')).not.toBeNull();
  });

  it('handles touch interactions and propagates theme selection', () => {
    const onThemeChange = vi.fn();

    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    const neonButton = screen.getByRole('button', { name: /apply neon theme/i });

    fireEvent.touchStart(neonButton);
    fireEvent.click(neonButton);

    expect(onThemeChange).toHaveBeenCalledWith('neon');
  });
});
