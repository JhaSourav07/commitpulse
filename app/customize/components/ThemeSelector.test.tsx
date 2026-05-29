import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeSelector } from './ThemeSelector';
import { THEME_KEYS } from '../types';

describe('ThemeSelector', () => {
  const onThemeChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);
    screen.getByRole('combobox');
  });

  it('renders a select element with all theme options', () => {
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(THEME_KEYS.length);
  });

  it('renders the SectionLabel with "Theme Preset" text', () => {
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);
    screen.getByText('Theme Preset');
  });

  it('shows "switches with OS theme" text when theme is "auto"', () => {
    render(<ThemeSelector theme="auto" onThemeChange={onThemeChange} />);
    screen.getByText(/switches with OS theme/i);
  });

  it('shows "changes on each load" text when theme is "random"', () => {
    render(<ThemeSelector theme="random" onThemeChange={onThemeChange} />);
    screen.getByText(/changes on each load/i);
  });

  it('shows "bg · accent · text" text for a regular theme', () => {
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);
    screen.getByText(/bg · accent · text/i);
  });
});
