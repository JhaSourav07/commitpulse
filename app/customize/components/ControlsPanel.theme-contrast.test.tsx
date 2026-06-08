import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ControlsPanel } from './ControlsPanel';
import type { BadgeSize, Font, Scale } from '../types';

vi.mock('./ThemeSelector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector">Theme Selector</div>,
  StyledSelect: ({
    children,
    id,
    value,
    onChange,
  }: {
    children: React.ReactNode;
    id?: string;
    value?: string;
    onChange?: (value: string) => void;
  }) => (
    <select
      data-testid={id ?? 'styled-select'}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {children}
    </select>
  ),
}));

const createProps = () => ({
  username: 'octocat',
  theme: 'default',
  bgHex: '',
  accentHex: '',
  textHex: '',
  scale: 'linear' as Scale,
  speed: 'normal',
  font: 'inter' as Font,
  year: '',
  radius: 12,
  size: 'md' as BadgeSize,
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
});

describe('ControlsPanel Theme Contrast', () => {
  it('renders core controls correctly in themed environment', () => {
    render(<ControlsPanel {...createProps()} />);

    expect(screen.getByText('Customization Studio')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username...')).toBeInTheDocument();
    expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
  });

  it('calls onUsernameChange when username input changes', () => {
    const props = createProps();

    render(<ControlsPanel {...props} />);

    fireEvent.change(screen.getByPlaceholderText('Enter username...'), {
      target: { value: 'new-user' },
    });

    expect(props.onUsernameChange).toHaveBeenCalledWith('new-user');
  });

  it('shows theme-aware custom color warning for auto theme', () => {
    render(<ControlsPanel {...createProps()} theme="auto" />);

    expect(screen.getByText(/Custom colors are disabled for the/i)).toBeInTheDocument();

    expect(screen.getByText('Auto')).toBeInTheDocument();
  });

  it('shows random theme warning message when random theme is selected', () => {
    render(<ControlsPanel {...createProps()} theme="random" />);

    expect(
      screen.getByText(/Random changes on every page load and disables caching/i)
    ).toBeInTheDocument();

    expect(screen.getByText('Random')).toBeInTheDocument();
  });

  it('calls onScaleChange when logarithmic scale button is clicked', () => {
    const props = createProps();

    render(<ControlsPanel {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Logarithmic' }));

    expect(props.onScaleChange).toHaveBeenCalledWith('log');
  });

  it('calls onRadiusChange when border radius slider value changes', () => {
    const props = createProps();

    render(<ControlsPanel {...props} />);

    const slider = screen.getByRole('slider');

    fireEvent.change(slider, {
      target: { value: '25' },
    });

    expect(props.onRadiusChange).toHaveBeenCalledWith(25);
  });
});
