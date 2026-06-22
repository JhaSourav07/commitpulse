import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ControlsPanel } from './ControlsPanel';
import type { BadgeSize, Font, Scale } from '../types';

const createProps = () => ({
  username: '',
  theme: 'dark',
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
  year: '',
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
});

describe('ControlsPanel Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders safely with empty default values', () => {
    render(<ControlsPanel {...createProps()} />);

    expect(document.getElementById('username-input')).toBeInTheDocument();
    expect(screen.getByText(/customization studio/i)).toBeInTheDocument();
  });

  it('shows fallback message and disables custom color controls for auto theme', () => {
    render(<ControlsPanel {...createProps()} theme="auto" />);

    expect(screen.getByText(/custom colors are disabled/i)).toBeInTheDocument();

    expect(screen.queryByLabelText(/color picker for custom background/i)).not.toBeInTheDocument();
  });

  it('shows fallback message and random-theme warning for random theme', () => {
    render(<ControlsPanel {...createProps()} theme="random" />);

    expect(screen.getByText(/custom colors are disabled/i)).toBeInTheDocument();

    expect(
      screen.getByText(/random changes on every page load and disables caching/i)
    ).toBeInTheDocument();
  });

  it('renders custom font fallback input when font value is empty', () => {
    render(<ControlsPanel {...createProps()} font="" />);

    expect(document.getElementById('font-custom-input')).toBeInTheDocument();
  });

  it('does not render clear overrides button when override values are empty', () => {
    render(<ControlsPanel {...createProps()} bgHex="" accentHex="" textHex="" />);

    expect(screen.queryByText(/clear custom/i)).not.toBeInTheDocument();
  });
});
