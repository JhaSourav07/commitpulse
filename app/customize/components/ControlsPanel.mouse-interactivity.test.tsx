import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { themes } from '../../../lib/svg/themes';
import { ControlsPanel } from './ControlsPanel';

const defaultProps = {
  username: 'octocat',
  theme: 'dark',
  bgHex: '',
  accentHex: '',
  textHex: '',
  scale: 'linear',
  speed: '8s',
  font: 'Inter',
  year: '',
  radius: 8,
  size: 'medium',
  onUsernameChange: vi.fn(),
  onThemeChange: vi.fn(),
  onBgHexChange: vi.fn(),
  onAccentHexChange: vi.fn(),
  onTextHexChange: vi.fn(),
  onScaleChange: vi.fn(),
  onSpeedChange: vi.fn(),
  onFontChange: vi.fn(),
  onYearChange: vi.fn(),
  onSizeChange: vi.fn(),
  onClearOverrides: vi.fn(),
  onRadiusChange: vi.fn(),
} satisfies ComponentProps<typeof ControlsPanel>;

const renderPanel = (props: Partial<ComponentProps<typeof ControlsPanel>> = {}) =>
  render(<ControlsPanel {...defaultProps} {...props} />);

const getElementById = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);

  expect(element).not.toBeNull();

  return element as T;
};

const getBackgroundColorPicker = () =>
  screen.getByLabelText(/color picker for .*background/i) as HTMLInputElement;

describe('ControlsPanel mouse and touch interactivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps scale hover passive and changes scale only when a real segmented control is clicked', () => {
    const onScaleChange = vi.fn();

    renderPanel({ onScaleChange, scale: 'linear' });

    const linearButton = screen.getByRole('button', { name: 'Linear' });
    const logButton = screen.getByRole('button', { name: 'Logarithmic' });

    fireEvent.mouseEnter(logButton);

    expect(onScaleChange).not.toHaveBeenCalled();
    expect(linearButton).toHaveClass('bg-emerald-500/15', 'text-emerald-700');
    expect(logButton).toHaveClass('hover:bg-gray-200/70', 'dark:hover:text-white/70');

    fireEvent.click(logButton);

    expect(onScaleChange).toHaveBeenCalledWith('log');
  });

  it('renders native tooltip titles and colors for the selected theme swatches', () => {
    renderPanel({ theme: 'neon' });

    const bgSwatch = screen.getByTitle(`bg: #${themes.neon.bg}`);
    const accentSwatch = screen.getByTitle(`accent: #${themes.neon.accent}`);
    const textSwatch = screen.getByTitle(`text: #${themes.neon.text}`);

    expect(bgSwatch).toHaveStyle({ backgroundColor: `#${themes.neon.bg}` });
    expect(accentSwatch).toHaveStyle({ backgroundColor: `#${themes.neon.accent}` });
    expect(textSwatch).toHaveStyle({ backgroundColor: `#${themes.neon.text}` });
  });

  it('routes click and touch events through the actual scale button', () => {
    const onBoundaryClick = vi.fn();
    const onBoundaryTouchStart = vi.fn();
    const onScaleChange = vi.fn();

    render(
      <div onClick={onBoundaryClick} onTouchStart={onBoundaryTouchStart}>
        <ControlsPanel {...defaultProps} onScaleChange={onScaleChange} />
      </div>
    );

    const logButton = screen.getByRole('button', { name: 'Logarithmic' });

    fireEvent.touchStart(logButton);
    fireEvent.click(logButton);

    expect(onBoundaryTouchStart).toHaveBeenCalledTimes(1);
    expect(onBoundaryClick).toHaveBeenCalledTimes(1);
    expect(onScaleChange).toHaveBeenCalledWith('log');
  });

  it('exposes pointer affordances on real select, color-picker, and shuffle controls', () => {
    renderPanel({ bgHex: '101820', accentHex: '00ffaa', textHex: 'ffffff' });

    const themeSelect = getElementById<HTMLSelectElement>('theme-select');
    const colorPickerInput = getBackgroundColorPicker();
    const colorPickerSurface = colorPickerInput.closest('label');
    const shuffleButton = screen.getByRole('button', { name: /shuffle/i });

    expect(themeSelect).toHaveClass('cursor-pointer');
    expect(colorPickerInput).toHaveClass('cursor-pointer');
    expect(colorPickerSurface).toHaveClass('cursor-pointer', 'hover:border-emerald-500/50');
    expect(shuffleButton).toHaveAttribute('title', 'Pick a random theme');
  });

  it('disables and restores custom color controls based on the real theme prop', () => {
    const { rerender } = renderPanel({ theme: 'random' });

    expect(screen.getByText(/changes on each load/i)).toBeInTheDocument();
    expect(screen.getByText(/Random changes on every page load/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/color picker for .*background/i)).not.toBeInTheDocument();

    const themeSection = screen.getByText('Theme Preset').closest('div');

    expect(themeSection).not.toBeNull();
    fireEvent.mouseLeave(themeSection!);

    expect(screen.getByText(/Random changes on every page load/i)).toBeInTheDocument();

    rerender(<ControlsPanel {...defaultProps} theme="dark" />);

    expect(screen.queryByText(/Random changes on every page load/i)).not.toBeInTheDocument();
    expect(getBackgroundColorPicker()).toBeInTheDocument();
  });
});
