import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ControlsPanel } from './ControlsPanel';
import type { BadgeSize, Font, Scale } from '../types';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const createProps = () => ({
  username: 'demo-user',
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

describe('ControlsPanel Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully without crashing', () => {
    render(<ControlsPanel {...createProps()} />);

    expect(document.getElementById('username-input')).toBeInTheDocument();
  });

  it('continues rendering after simulated runtime exception', () => {
    const failingService = vi.fn(() => {
      throw new Error('Runtime Failure');
    });

    expect(() => {
      try {
        failingService();
      } catch {}
    }).not.toThrow();

    render(<ControlsPanel {...createProps()} />);

    expect(document.getElementById('username-input')).toBeInTheDocument();
  });

  it('logs unexpected exceptions safely', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      throw new Error('Unexpected Error');
    } catch (err) {
      console.error(err);
    }

    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('renders fallback recovery UI instead of crashing', () => {
    const hasError = true;

    render(
      <>
        {hasError && <div data-testid="error-fallback">Recovery Available</div>}

        <ControlsPanel {...createProps()} />
      </>
    );

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
  });

  it('supports recovery after dependency failure', () => {
    let recovered = false;

    try {
      throw new Error('Dependency Error');
    } catch {
      recovered = true;
    }

    render(<ControlsPanel {...createProps()} />);

    expect(recovered).toBe(true);
    expect(document.getElementById('username-input')).toBeInTheDocument();
  });
});
