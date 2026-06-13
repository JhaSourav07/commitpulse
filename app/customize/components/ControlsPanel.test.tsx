import '@testing-library/jest-dom';
import type { Scale, BadgeSize, Font, ViewMode, DeltaFormat, Language, Timezone } from '../types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlsPanel } from './ControlsPanel';

const defaultProps = {
  username: '',
  theme: 'github-dark',
  bgHex: '',
  bgType: 'solid' as const,
  bgStart: '',
  bgEnd: '',
  bgAngle: 90,
  accentHex: '',
  textHex: '',
  scale: 'linear' as Scale,
  speed: '8s',
  font: '' as Font,
  year: '2025',
  radius: 8,
  size: 'medium' as BadgeSize,

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

  hideTitle: false,
  hideBackground: false,
  hideStats: false,

  viewMode: 'default' as ViewMode,
  deltaFormat: 'percent' as DeltaFormat,

  badgeWidth: 0,
  badgeHeight: 0,

  grace: 1,

  language: 'en' as Language,
  timezone: 'UTC' as Timezone,

  onHideTitleChange: vi.fn(),
  onHideBackgroundChange: vi.fn(),
  onHideStatsChange: vi.fn(),

  onViewModeChange: vi.fn(),
  onDeltaFormatChange: vi.fn(),

  onBadgeWidthChange: vi.fn(),
  onBadgeHeightChange: vi.fn(),

  onGraceChange: vi.fn(),

  onLanguageChange: vi.fn(),
  onTimezoneChange: vi.fn(),
};
describe('ControlsPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the GitHub Username label', () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(screen.getByText(/GitHub Username/i)).toBeTruthy();
  });

  it('renders username input with correct id', () => {
    render(<ControlsPanel {...defaultProps} />);
    const input = document.getElementById('username-input');

    expect(input).toHaveAttribute('id', 'username-input');
  });

  it('renders a generic username placeholder', () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(screen.getByPlaceholderText('Enter username...')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('jhasourav07')).not.toBeInTheDocument();
  });

  it('calls onUsernameChange when typing', () => {
    render(<ControlsPanel {...defaultProps} />);

    const input = document.getElementById('username-input');

    fireEvent.change(input!, {
      target: { value: 'shikhar' },
    });

    expect(defaultProps.onUsernameChange).toHaveBeenCalled();
  });

  it('renders Linear and Logarithmic buttons', () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(screen.getByRole('button', { name: /^Linear$/ })).toBeTruthy();

    expect(screen.getByRole('button', { name: /^Logarithmic$/ })).toBeTruthy();
  });

  it('calls onScaleChange with log', () => {
    render(<ControlsPanel {...defaultProps} />);

    const logButton = screen.getByRole('button', { name: /^Logarithmic$/ });

    fireEvent.click(logButton);

    expect(defaultProps.onScaleChange).toHaveBeenCalledWith('log');
  });

  it('hides Clear overrides button initially', () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(screen.queryByText(/Clear Custom Colors/i)).toBeNull();
  });

  it('shows Clear overrides button when bgHex is provided', () => {
    render(<ControlsPanel {...defaultProps} bgHex="#000000" />);

    expect(screen.getByText(/Clear Custom Colors/i)).toBeTruthy();
  });
});
