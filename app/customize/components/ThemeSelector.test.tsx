import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('renders the Shuffle button', () => {
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);
    expect(screen.getByTitle('Pick a random theme')).toBeTruthy();
  });

  it('clicking Shuffle calls onThemeChange with a valid theme key', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);
    const shuffleBtn = screen.getByTitle('Pick a random theme');
    await user.click(shuffleBtn);
    expect(onThemeChange).toHaveBeenCalledTimes(1);
    const calledWith = onThemeChange.mock.calls[0][0];
    expect(THEME_KEYS).toContain(calledWith);
    expect(calledWith).not.toBe('auto');
    expect(calledWith).not.toBe('random');
  });

  it('changing the select calls onThemeChange with the selected value', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'neon');
    expect(onThemeChange).toHaveBeenCalledWith('neon');
  });

  it('renders color swatches for a normal theme', () => {
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);
    const swatches = screen.getAllByTitle(/^(bg|accent|text):/i);
    expect(swatches.length).toBe(3);
  });
});

describe('ThemeSelector - Custom Variations (Variation 4)', () => {
  const onThemeChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders ThemeSelector successfully and layout structure exists', () => {
    const { container } = render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    // ThemeSelector renders successfully
    expect(screen.getByRole('combobox')).toBeTruthy();
    expect(screen.getByText('Theme Preset')).toBeTruthy();

    // Layout structure exists
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toBeTruthy();
    expect(mainContainer.className).toContain('flex');
    expect(mainContainer.className).toContain('flex-col');
    expect(mainContainer.className).toContain('gap-1.5');
  });

  it('verifies that selecting Dracula preset calls onThemeChange("dracula")', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    // Select Dracula preset via accessibility query
    const draculaBtn = screen.getByRole('button', { name: /apply dracula theme/i });
    expect(draculaBtn).toBeTruthy();

    // Click it
    await user.click(draculaBtn);

    // Verify onThemeChange was called with 'dracula'
    expect(onThemeChange).toHaveBeenCalledWith('dracula');
  });

  it('verifies that selecting Neon preset calls onThemeChange("neon")', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    // Select Neon preset via accessibility query
    const neonBtn = screen.getByRole('button', { name: /apply neon theme/i });
    expect(neonBtn).toBeTruthy();

    // Click it
    await user.click(neonBtn);

    // Verify onThemeChange was called with 'neon'
    expect(onThemeChange).toHaveBeenCalledWith('neon');
  });

  it('verifies the select dropdown calls onThemeChange with the selected theme', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'sunset');

    expect(onThemeChange).toHaveBeenCalledWith('sunset');
  });
});

describe('ThemeSelector - Custom Variations (Variation 4)', () => {
  const onThemeChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders ThemeSelector successfully and layout structure exists', () => {
    const { container } = render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    // ThemeSelector renders successfully
    expect(screen.getByRole('combobox')).toBeTruthy();
    expect(screen.getByText('Theme Preset')).toBeTruthy();

    // Layout structure exists
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toBeTruthy();
    expect(mainContainer.className).toContain('flex');
    expect(mainContainer.className).toContain('flex-col');
    expect(mainContainer.className).toContain('gap-1.5');
  });

  it('verifies that selecting Dracula preset calls onThemeChange("dracula")', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    // Select Dracula preset via accessibility query
    const draculaBtn = screen.getByRole('button', { name: /apply dracula theme/i });
    expect(draculaBtn).toBeTruthy();

    // Click it
    await user.click(draculaBtn);

    // Verify onThemeChange was called with 'dracula'
    expect(onThemeChange).toHaveBeenCalledWith('dracula');
  });

  it('verifies that selecting Neon preset calls onThemeChange("neon")', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    // Select Neon preset via accessibility query
    const neonBtn = screen.getByRole('button', { name: /apply neon theme/i });
    expect(neonBtn).toBeTruthy();

    // Click it
    await user.click(neonBtn);

    // Verify onThemeChange was called with 'neon'
    expect(onThemeChange).toHaveBeenCalledWith('neon');
  });

  it('verifies the select dropdown calls onThemeChange with the selected theme', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'sunset');

    expect(onThemeChange).toHaveBeenCalledWith('sunset');
  });
});
