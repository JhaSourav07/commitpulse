import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ControlsPanel } from './ControlsPanel';
import type { BadgeSize, Font, Scale } from '../types';

// --------------------
// Translation Mock
// --------------------
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'customize_cta.studio_badge': 'Studio Badge',
        'customize.controls.username': 'GitHub Username',
        'customize.controls.username_placeholder': 'Enter username...',
        'customize.controls.sync_year': 'Year',
        'customize.controls.color_overrides': 'Color Overrides',
        'customize.controls.custom_bg': 'Background',
        'customize.controls.custom_accent': 'Accent',
        'customize.controls.custom_text': 'Text',
        'customize.controls.clear_custom': 'Clear Custom Colors',
        'customize.controls.log_scaling': 'Scaling',
        'customize.controls.speed': 'Speed',
        'customize.controls.font': 'Font',
        'customize.controls.radius': 'Radius',
        'customize.controls.badge_size': 'Badge Size',
        'customize.controls.custom_font_option': 'Custom',
        'customize.controls.custom_font_placeholder': 'Enter font',
      };

      return map[key] ?? key;
    },
  }),
}));

const props = {
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
};

describe('ControlsPanel Responsive Breakpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('375'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders correctly on mobile viewport', () => {
    window.innerWidth = 375;

    render(<ControlsPanel {...props} />);

    expect(screen.getByPlaceholderText(/enter username/i)).toBeInTheDocument();
  });

  it('keeps username input at full width', () => {
    render(<ControlsPanel {...props} />);

    const input = document.getElementById('username-input');

    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('min-w-0');
  });

  it('renders scale buttons in a responsive 3-column grid', () => {
    const { container } = render(<ControlsPanel {...props} />);

    const grid = container.querySelector('.grid.grid-cols-3');

    expect(grid).toBeInTheDocument();
  });

  it('does not render fixed width controls causing overflow', () => {
    const { container } = render(<ControlsPanel {...props} />);

    const fixedWidth = container.querySelector('[class*="w-[3"]');

    expect(fixedWidth).toBeNull();
  });

  it('renders responsive select controls', () => {
    render(<ControlsPanel {...props} />);

    expect(document.getElementById('year-select')).toBeInTheDocument();
    expect(document.getElementById('speed-select')).toBeInTheDocument();
    expect(document.getElementById('font-select')).toBeInTheDocument();
    expect(document.getElementById('size-select')).toBeInTheDocument();
  });
});
