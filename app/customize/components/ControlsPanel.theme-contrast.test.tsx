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

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'customize_cta.studio_badge': 'Customization Studio',
        'customize.controls.username': 'Username',
        'customize.controls.username_placeholder': 'Enter username...',
        'customize.controls.sync_year': 'Sync Year',
        'customize.controls.color_overrides': 'Color Overrides',
        'customize.controls.custom_bg': 'Custom Background',
        'customize.controls.custom_accent': 'Custom Accent',
        'customize.controls.custom_text': 'Custom Text',
        'customize.controls.clear_custom': 'Clear Custom Colors',
        'customize.controls.log_scaling': 'Log Scaling',
        'customize.controls.speed': 'Speed',
        'customize.controls.font': 'Font',
        'customize.controls.custom_font_option': 'Custom Font',
        'customize.controls.custom_font_placeholder': 'Enter font name',
        'customize.controls.radius': 'Border Radius',
        'customize.controls.badge_size': 'Badge Size',
      };
      return translations[key] ?? key;
    },
  }),
}));

const createProps = () => ({
  username: 'octocat',
  theme: 'default',
  bgHex: '',
  bgType: 'solid' as const,
  bgStart: '',
  bgEnd: '',
  bgAngle: 90,
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
  onBgTypeChange: vi.fn(),
  onBgStartChange: vi.fn(),
  onBgEndChange: vi.fn(),
  onBgAngleChange: vi.fn(),
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
