import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeQuickPresets } from './ThemeQuickPresets';
import react from 'react';

vi.mock('../../../lib/svg/themes', () => ({
  themes: {
    dark: {
      bg: '000000',
      text: 'ffffff',
      accent: '00ff00',
    },
    light: {
      bg: 'ffffff',
      text: '000000',
      accent: '0066ff',
    },
    neon: {
      bg: '111111',
      text: 'ffffff',
      accent: 'ff00ff',
    },
  },
}));

vi.mock('../types', () => ({
  THEME_KEYS: ['dark', 'light', 'neon', 'auto', 'random'],
}));

describe('ThemeQuickPresets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders only selectable themes', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);

    expect(screen.getByLabelText('Apply dark theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Apply light theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Apply neon theme')).toBeInTheDocument();

    expect(screen.queryByLabelText('Apply auto theme')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Apply random theme')).not.toBeInTheDocument();
  });

  it('marks active theme with aria-pressed', () => {
    render(<ThemeQuickPresets theme="light" onThemeChange={vi.fn()} />);

    expect(screen.getByLabelText('Apply light theme')).toHaveAttribute('aria-pressed', 'true');

    expect(screen.getByLabelText('Apply dark theme')).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onThemeChange when clicked', () => {
    const onThemeChange = vi.fn();

    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    fireEvent.click(screen.getByLabelText('Apply neon theme'));

    expect(onThemeChange).toHaveBeenCalledTimes(1);
    expect(onThemeChange).toHaveBeenCalledWith('neon');
  });

  it('renders one button for every selectable theme', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('shows active theme styling', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);

    expect(screen.getByLabelText('Apply dark theme')).toHaveClass('tqp-on');
    expect(screen.getByLabelText('Apply light theme')).not.toHaveClass('tqp-on');
  });
});
