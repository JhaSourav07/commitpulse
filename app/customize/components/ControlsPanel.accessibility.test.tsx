import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ControlsPanel } from './ControlsPanel';
import type { BadgeSize, Font, Scale, ViewMode, DeltaFormat, Language, Timezone } from '../types';

const defaultProps = {
  username: 'octocat',
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

const renderPanel = () => render(<ControlsPanel {...defaultProps} />);

describe('ControlsPanel Accessibility Standards & Screen Reader Aria Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders username input control', () => {
    renderPanel();

    expect(document.getElementById('username-input')).toBeInTheDocument();
  });

  it('renders color pickers with accessible aria labels', () => {
    renderPanel();

    expect(screen.getByLabelText(/color picker for custom background/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/color picker for custom accent/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/color picker for custom text/i)).toBeInTheDocument();
  });

  it('renders scale buttons with accessible names', () => {
    renderPanel();

    expect(screen.getByRole('button', { name: 'Linear' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Logarithmic' })).toBeInTheDocument();
  });

  it('renders select controls used by keyboard and screen readers', () => {
    renderPanel();

    expect(document.getElementById('year-select')).toBeInTheDocument();
    expect(document.getElementById('speed-select')).toBeInTheDocument();
    expect(document.getElementById('font-select')).toBeInTheDocument();
    expect(document.getElementById('size-select')).toBeInTheDocument();
  });

  it('renders radius slider control', () => {
    renderPanel();

    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});
